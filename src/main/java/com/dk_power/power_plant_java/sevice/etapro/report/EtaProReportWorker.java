package com.dk_power.power_plant_java.sevice.etapro.report;

import com.dk_power.power_plant_java.entities.etapro.EtaProReport;
import com.dk_power.power_plant_java.entities.etapro.EtaProReportExecution;
import com.dk_power.power_plant_java.entities.etapro.EtaProReportExecution.Status;
import com.dk_power.power_plant_java.entities.etapro.report.ReportDefinition;
import com.dk_power.power_plant_java.entities.etapro.report.ReportParams;
import com.dk_power.power_plant_java.entities.etapro.report.ReportResults;
import com.dk_power.power_plant_java.repository.etapro.EtaProReportExecutionRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Async worker for report executions. Separate from the scrape worker —
 * report execution is DB/CPU work, not serialized behind Excel COM.
 *
 * <p>Polls for PENDING executions every 2 seconds. Processes one at a time
 * to avoid overloading the DB with concurrent heavy queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProReportWorker {

    private final EtaProReportExecutionRepo executionRepo;
    private final EtaProReportEngine engine;
    private final ObjectMapper objectMapper;

    private volatile boolean running;
    private Thread workerThread;

    @PostConstruct
    public void start() {
        // Reap orphaned RUNNING executions from previous crashes
        reapOrphans();

        running = true;
        workerThread = new Thread(this::loop, "etapro-report-worker");
        workerThread.setDaemon(true);
        workerThread.start();
        log.info("[Report] Worker started");
    }

    @PreDestroy
    public void stop() {
        running = false;
        if (workerThread != null) {
            workerThread.interrupt();
            try { workerThread.join(5000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
        log.info("[Report] Worker stopped");
    }

    private void loop() {
        while (running) {
            try {
                EtaProReportExecution pending = executionRepo
                        .findFirstByStatusOrderByDateCreatedAsc(Status.PENDING)
                        .orElse(null);

                if (pending != null) {
                    processExecution(pending);
                } else {
                    Thread.sleep(2000);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("[Report] Worker error", e);
                try { Thread.sleep(5000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
            }
        }
    }

    @Transactional
    public void processExecution(EtaProReportExecution execution) {
        Long execId = execution.getId();
        log.info("[Report] Starting execution {}", execId);

        try {
            // Mark RUNNING
            execution.setStatus(Status.RUNNING);
            execution.setStartedAt(LocalDateTime.now());
            executionRepo.save(execution);

            // Parse definition and params
            EtaProReport report = execution.getReport();
            if (report == null) {
                throw new IllegalStateException("Execution has no associated report");
            }

            ReportDefinition definition = objectMapper.readValue(report.getDefinitionJson(), ReportDefinition.class);
            ReportParams params;
            if (execution.getParamsJson() != null && !execution.getParamsJson().isBlank()) {
                params = objectMapper.readValue(execution.getParamsJson(), ReportParams.class);
            } else if (report.getDefaultParamsJson() != null && !report.getDefaultParamsJson().isBlank()) {
                params = objectMapper.readValue(report.getDefaultParamsJson(), ReportParams.class);
            } else {
                params = new ReportParams();
            }

            // Check cancellation before heavy work
            if (isCancelled(execId)) { markCancelled(execution); return; }

            // Update progress: loading data
            execution.setProgress(10);
            executionRepo.save(execution);

            // Execute
            EtaProReportEngine.ExecutionResult result = engine.execute(definition, params);

            // Check cancellation after execution
            if (isCancelled(execId)) { markCancelled(execution); return; }

            // Update progress: saving results
            execution.setProgress(90);
            executionRepo.save(execution);

            // Persist results
            execution.setStatus(Status.COMPLETE);
            execution.setSummaryJson(objectMapper.writeValueAsString(result.summary()));
            execution.setResultPayloadJson(objectMapper.writeValueAsString(result.payload()));
            execution.setInstancesFound(result.summary().getInstancesFound());
            execution.setCompletedAt(LocalDateTime.now());
            execution.setDurationMs(Duration.between(execution.getStartedAt(), execution.getCompletedAt()).toMillis());
            execution.setProgress(100);
            executionRepo.save(execution);

            log.info("[Report] Execution {} complete: {} instances in {}ms",
                    execId, execution.getInstancesFound(), execution.getDurationMs());

        } catch (Exception e) {
            log.error("[Report] Execution {} failed", execId, e);
            execution.setStatus(Status.FAILED);
            execution.setErrorMessage(e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 1000)) : "Unknown error");
            execution.setCompletedAt(LocalDateTime.now());
            if (execution.getStartedAt() != null) {
                execution.setDurationMs(Duration.between(execution.getStartedAt(), execution.getCompletedAt()).toMillis());
            }
            executionRepo.save(execution);
        }
    }

    private boolean isCancelled(Long execId) {
        return executionRepo.findById(execId)
                .map(e -> e.getStatus() == Status.CANCELLED)
                .orElse(true);
    }

    private void markCancelled(EtaProReportExecution execution) {
        execution.setStatus(Status.CANCELLED);
        execution.setCompletedAt(LocalDateTime.now());
        if (execution.getStartedAt() != null) {
            execution.setDurationMs(Duration.between(execution.getStartedAt(), execution.getCompletedAt()).toMillis());
        }
        executionRepo.save(execution);
        log.info("[Report] Execution {} cancelled", execution.getId());
    }

    private void reapOrphans() {
        List<EtaProReportExecution> orphans = executionRepo.findByStatus(Status.RUNNING);
        for (EtaProReportExecution exec : orphans) {
            exec.setStatus(Status.FAILED);
            exec.setErrorMessage("Orphaned by application restart");
            exec.setCompletedAt(LocalDateTime.now());
            executionRepo.save(exec);
            log.warn("[Report] Reaped orphaned execution {}", exec.getId());
        }
    }
}
