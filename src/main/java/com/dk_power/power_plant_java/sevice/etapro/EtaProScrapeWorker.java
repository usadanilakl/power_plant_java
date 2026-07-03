package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.sevice.etapro.EtaProHistoryJobService.BatchPlan;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine.BatchResult;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine.Template;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Single-threaded worker that interleaves live and history scrapes.
 *
 * <h3>Loop logic</h3>
 * <pre>
 * loop:
 *   if live subscription active AND (now - lastLiveTickStart) >= liveIntervalMs:
 *     run a full live cycle (all subscribed points, batched 20 at a time)
 *     lastLiveTickStart = now
 *     continue (re-check live)
 *
 *   else if a manual EPLog pull is queued:
 *     run it (preempts the next history batch; one-shot, user-initiated)
 *     continue
 *
 *   else if a PENDING history job exists OR a RUNNING history job has remaining batches:
 *     run one history batch
 *     continue
 *
 *   else:
 *     if a deferred process-stop was requested (and no live subscription): tear down Excel
 *     else sleep 200ms
 * </pre>
 *
 * <p>Concurrency model: single worker thread. No parallelism because the underlying
 * Excel process is serial. The loop runs until {@link #stop()} flips the flag.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProScrapeWorker {

    private final EtaProScraperEngine engine;
    private final EtaProLiveService liveService;
    private final EtaProHistoryJobService historyJobService;
    private final EtaProLogPullService logPullService;

    @Value("${etapro.live.interval.ms:3000}")
    private long liveIntervalMs;

    @Value("${etapro.worker.idle-sleep.ms:200}")
    private long idleSleepMs;

    private volatile boolean running;
    private Thread workerThread;
    private long lastLiveTickStart;

    // Current job being processed (null when idle or between jobs)
    private volatile Long currentJobId;
    private volatile List<BatchPlan> currentPlan;
    private volatile int currentBatchIndex;
    private volatile int consecutiveFailures;

    @PostConstruct
    public void start() {
        // Reap any RUNNING jobs left over from a previous crash
        historyJobService.reapOrphanedJobs();

        running = true;
        workerThread = new Thread(this::loop, "etapro-scrape-worker");
        workerThread.setDaemon(true);
        workerThread.start();
        log.info("[EtaPro] Scrape worker started");
    }

    @PreDestroy
    public void stop() {
        running = false;
        if (workerThread != null) {
            workerThread.interrupt();
            try {
                workerThread.join(5000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        log.info("[EtaPro] Scrape worker stopped");
    }

    // ── Main loop ─────────────────────────────────────────────

    private void loop() {
        while (running) {
            try {
                boolean didWork = false;

                // 1. Live has priority if it's due
                if (liveService.isActive()) {
                    long now = System.currentTimeMillis();
                    if (lastLiveTickStart == 0 || (now - lastLiveTickStart) >= liveIntervalMs) {
                        lastLiveTickStart = now;
                        runLiveCycle();
                        didWork = true;
                    }
                }

                // 2. A queued manual EPLog pull preempts the next history batch — it's a one-shot,
                //    user-initiated action the UI is waiting on. Live still has priority above it.
                if (!didWork && logPullService.runPendingIfAny()) {
                    didWork = true;
                }

                // 3. Otherwise, advance history
                if (!didWork && advanceHistory()) {
                    didWork = true;
                }

                if (!didWork) {
                    // Idle: honor a deferred process teardown (requested by live/stop off the request
                    // thread) before sleeping, but only when no live subscription is active.
                    if (!liveService.isActive() && engine.consumeStopRequest()) {
                        // Re-check: live may have (re)started between the guard and the claim.
                        if (!liveService.isActive()) {
                            engine.stopProcess();
                        }
                    } else {
                        Thread.sleep(idleSleepMs);
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Throwable t) {
                log.error("[EtaPro] Worker loop error", t);
                try { Thread.sleep(1000); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    // ── Live cycle ────────────────────────────────────────────

    private void runLiveCycle() {
        List<String> points = liveService.getSubscribedPoints();
        if (points.isEmpty()) return;

        List<List<String>> chunks = EtaProHistoryJobService.chunkPoints(points,
                EtaProScraperEngine.MAX_POINTS_PER_LIVE_BATCH);
        int totalImported = 0;

        // Window: last N seconds. The live template uses a small window (e.g., 10 sec).
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusSeconds(15);

        for (List<String> chunk : chunks) {
            if (!running || !liveService.isActive()) return;
            BatchResult result = engine.executeBatch(Template.LIVE, chunk, start, end);
            if (result.success) {
                totalImported += result.importedCount;
                consecutiveFailures = 0;
            } else {
                log.warn("[EtaPro] Live batch failed: {}", result.message);
                consecutiveFailures++;
                // Back off on repeated failures to avoid hammering a dead process
                if (consecutiveFailures > 3) {
                    long backoffMs = Math.min(consecutiveFailures * 2000L, 30_000L);
                    log.warn("[EtaPro] {} consecutive failures, backing off {}ms", consecutiveFailures, backoffMs);
                    try { Thread.sleep(backoffMs); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); return; }
                }
                return; // Don't process remaining chunks if one failed
            }
        }

        liveService.recordCycleComplete(totalImported);
    }

    // ── History advancement ──────────────────────────────────

    /**
     * Runs one history batch. Returns true if work was done, false if nothing to do.
     */
    private boolean advanceHistory() {
        // Ensure we have a current job + plan
        if (currentJobId == null) {
            EtaProScrapeJob pending = historyJobService.nextPendingHistoryJob().orElse(null);
            if (pending == null) return false;

            currentJobId = pending.getId();
            currentPlan = historyJobService.planBatches(pending);
            currentBatchIndex = 0;
            historyJobService.markRunning(currentJobId);
            log.info("[EtaPro] Starting history job {} ({} batches)", currentJobId, currentPlan.size());
        }

        // Check for cancellation mid-job
        if (historyJobService.isCancelled(currentJobId)) {
            log.info("[EtaPro] History job {} cancelled — stopping", currentJobId);
            clearCurrentJob();
            return true;
        }

        if (currentBatchIndex >= currentPlan.size()) {
            // Plan exhausted — shouldn't normally happen (state should be COMPLETE by now)
            clearCurrentJob();
            return true;
        }

        BatchPlan plan = currentPlan.get(currentBatchIndex);
        BatchResult result = engine.executeBatch(Template.HISTORY, plan.pointIds(), plan.start(), plan.end());

        if (!result.success) {
            log.error("[EtaPro] History batch failed for job {}: {}", currentJobId, result.message);
            historyJobService.markFailed(currentJobId, result.message);
            clearCurrentJob();
            return true;
        }

        historyJobService.recordBatchComplete(currentJobId, result.importedCount);
        currentBatchIndex++;

        // If plan exhausted, clear — the service already marked it COMPLETE
        if (currentBatchIndex >= currentPlan.size()) {
            log.info("[EtaPro] History job {} complete", currentJobId);
            clearCurrentJob();
        }

        return true;
    }

    private void clearCurrentJob() {
        currentJobId = null;
        currentPlan = null;
        currentBatchIndex = 0;
    }

    // ── Status accessors ──────────────────────────────────────

    public boolean isRunning() {
        return running;
    }

    public Long getCurrentJobId() {
        return currentJobId;
    }

    public int getCurrentBatchIndex() {
        return currentBatchIndex;
    }
}
