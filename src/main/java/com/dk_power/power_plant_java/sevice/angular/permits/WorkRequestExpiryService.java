package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Scheduled service that auto-expires Active work requests
 * where dateOfWorkToBePerformed + 1 day is in the past.
 * Hub-aware: only the hub runs expiry when online; clients run it when offline.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkRequestExpiryService {
    private final WorkRequestRepo workRequestRepo;
    private final NgValueService valueService;
    private final WorkRequestSharePointAdapter wrAdapter;
    private final SyncConfig syncConfig;
    @Lazy private final CentralSyncService centralSyncService;

    @Scheduled(fixedDelay = 3600000, initialDelay = 60000) // every hour, 1 min initial delay
    @Transactional
    public void expireOverdueWorkRequests() {
        if (!syncConfig.isHubMode()) return;

        List<WorkRequest> activeWrs = workRequestRepo.findByPermitStatus_NameIgnoreCase("Active");
        LocalDate today = LocalDate.now(ZoneId.of("America/Chicago"));
        int expired = 0;

        for (WorkRequest wr : activeWrs) {
            LocalDate workDate = parseDate(wr.getDateOfWorkToBePerformed());
            if (workDate != null && workDate.plusDays(1).isBefore(today)) {
                wr.setPermitStatus(valueService.createValue("Permit Status", "Expired"));
                workRequestRepo.save(wr);
                if (wr.getSharepointId() != null) {
                    try {
                        wrAdapter.changeStatus(wr.getSharepointId(), "Expired");
                    } catch (Exception e) {
                        log.warn("[WR Expiry] Failed to update SharePoint for id={}: {}", wr.getId(), e.getMessage());
                    }
                }
                expired++;
                log.debug("[WR Expiry] Expired WR id={}, workDate={}", wr.getId(), wr.getDateOfWorkToBePerformed());
            }
        }

        if (expired > 0) {
            log.info("[WR Expiry] Expired {} overdue work requests", expired);
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        try {
            return LocalDate.parse(dateStr); // yyyy-MM-dd ISO format
        } catch (Exception e) {
            log.warn("[WR Expiry] Failed to parse date '{}': {}", dateStr, e.getMessage());
            return null;
        }
    }
}
