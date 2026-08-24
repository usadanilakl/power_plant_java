package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.enums.WorkRequestStatuses;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import com.dk_power.power_plant_java.sevice.sync.OldWorkRequestExcelStatusService;
import com.dk_power.power_plant_java.util.PermitDates;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Scheduled service that auto-expires OPEN work requests (see {@code WorkRequestStatuses.OPEN})
 * where dateOfWorkToBePerformed + 1 day is in the past.
 *
 * <p>Also the reason SharePoint auto-close is disabled in the orchestrator: the incremental fetch
 * cannot prove a request is gone, so closing overdue requests happens here on the date instead.
 *
 * <p>Hub-aware: only the hub runs expiry when online; clients run it when offline.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkRequestExpiryService {
    private static final List<String> OPEN_STATUSES_LOWER =
        WorkRequestStatuses.OPEN.stream().map(String::toLowerCase).toList();

    private final WorkRequestRepo workRequestRepo;
    private final NgValueService valueService;
    private final WorkRequestSharePointAdapter wrAdapter;
    private final SyncConfig syncConfig;
    private final OldWorkRequestExcelStatusService oldWorkRequestExcelStatusService;
    @Lazy private final CentralSyncService centralSyncService;

    /**
     * Kill switch for the expiry sweep. On by default — production wants it.
     *
     * <p>Exists because this sweep WRITES to SharePoint: it stamps "Expired" on the real list item
     * of every overdue request it finds locally. That makes it actively dangerous on any instance
     * that holds a copy of production data but is not the production hub — a lab, a replica, a
     * restored backup. And it is easy to arm by accident: the guard below is
     * {@code isHubMode() || !isServerAvailable()}, and {@code serverAvailable} starts false, so
     * simply disabling sync on a test instance turns the sweep ON rather than off.
     *
     * <p>Set {@code permits.work-request.expiry.enabled=false} on anything that is not the hub.
     */
    @Value("${permits.work-request.expiry.enabled:true}")
    private boolean expiryEnabled;

    @Scheduled(fixedDelay = 3600000, initialDelay = 60000) // every hour, 1 min initial delay
    @Transactional
    public void expireOverdueWorkRequests() {
        if (!expiryEnabled) {
            log.debug("[WR Expiry] Disabled via permits.work-request.expiry.enabled=false");
            return;
        }
        boolean shouldRunLocally = syncConfig.isHubMode() || !centralSyncService.isServerAvailable();
        if (!shouldRunLocally) {
            log.debug("[WR Expiry] Skipping local expiry because hub/server is available");
            return;
        }

        // Every OPEN status, not just "Active". A request the requester edited becomes "Updated"
        // and one we asked for more detail on becomes "Pending More Info"; both used to fall out of
        // this sweep entirely and sit in the queue forever.
        List<WorkRequest> openWrs = workRequestRepo.findByPermitStatusNameInIgnoreCase(OPEN_STATUSES_LOWER);
        LocalDate today = LocalDate.now(ZoneId.of("America/Chicago"));
        int expired = 0;

        for (WorkRequest wr : openWrs) {
            LocalDate workDate = PermitDates.parse(wr.getDateOfWorkToBePerformed());
            if (workDate != null && !workDate.plusDays(1).isAfter(today)) {
                wr.setPermitStatus(valueService.createValue("Permit Status", WorkRequestStatuses.EXPIRED));
                workRequestRepo.save(wr);
                if (wr.getSharepointId() != null) {
                    try {
                        wrAdapter.changeStatus(wr.getSharepointId(), "Expired");
                    } catch (Exception e) {
                        log.warn("[WR Expiry] Failed to update SharePoint for id={}: {}", wr.getId(), e.getMessage());
                    }
                }
                oldWorkRequestExcelStatusService.updateStatusIfBackedByOldExcel(wr, "Expired");
                expired++;
                log.debug("[WR Expiry] Expired WR id={}, workDate={}", wr.getId(), wr.getDateOfWorkToBePerformed());
            }
        }

        if (expired > 0) {
            log.info("[WR Expiry] Expired {} overdue work requests", expired);
        }
    }

}
