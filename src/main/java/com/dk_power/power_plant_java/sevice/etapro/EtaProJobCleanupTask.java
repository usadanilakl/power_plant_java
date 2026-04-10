package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob.Status;
import com.dk_power.power_plant_java.repository.etapro.EtaProScrapeJobRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Deletes old terminal-state jobs past the retention window.
 * Runs daily at 03:00. Configurable via {@code etapro.job.retention.days} (default 90).
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProJobCleanupTask {

    private final EtaProScrapeJobRepo jobRepo;

    @Value("${etapro.job.retention.days:90}")
    private int retentionDays;

    @Scheduled(cron = "${etapro.job.cleanup.cron:0 0 3 * * ?}")
    @Transactional
    public void cleanupOldJobs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        int total = 0;
        for (Status status : List.of(Status.COMPLETE, Status.FAILED, Status.CANCELLED)) {
            List<EtaProScrapeJob> old = jobRepo.findByStatusAndCompletedAtBefore(status, cutoff);
            if (!old.isEmpty()) {
                jobRepo.deleteAll(old);
                total += old.size();
            }
        }
        if (total > 0) {
            log.info("[EtaPro] Cleanup: deleted {} jobs older than {} days", total, retentionDays);
        }
    }
}
