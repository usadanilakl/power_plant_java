package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Keeps drift fresh in the BACKGROUND so tables just render cached badges — no per-page-load scan and no
 * manual clicking. Runs {@code detectAll()} on a fixed cadence (and once shortly after boot). Gated on a
 * sync server being configured, so it is a no-op on the hub itself (which has nothing to compare against).
 * The manual "Re-check drift" button remains as an on-demand refresh.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DriftScanScheduler {

    private final DriftDetectionService driftDetectionService;
    private final SyncConfig syncConfig;

    @Value("${sync.drift.scan-enabled:true}")
    private boolean enabled;

    @Scheduled(fixedDelayString = "${sync.drift.scan-interval-ms:900000}",
               initialDelayString = "${sync.drift.scan-initial-delay-ms:20000}")
    public void scheduledScan() {
        if (!enabled) return;
        if (syncConfig.isHubMode() || !syncConfig.isServerSyncConfigured()) return;
        String url = syncConfig.getSyncServerUrl();
        if (url == null || url.isBlank()) return;
        try {
            DriftDetectionService.DriftScanResult r = driftDetectionService.detectAll();
            log.info("drift.scheduled_scan done: {} type(s), {} flagged, {} still-drifting, {} error(s)",
                    r.typesScanned, r.flagged, r.stillDrifting, r.errors);
        } catch (Exception e) {
            log.warn("drift.scheduled_scan failed: {}", e.getMessage());
        }
    }
}
