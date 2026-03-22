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
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

/**
 * Scheduled service that auto-expires Active work requests
 * where dateOfWorkToBePerformed + 1 day is in the past.
 * Hub-aware: only the hub runs expiry when online; clients run it when offline.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkRequestExpiryService {
    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
        DateTimeFormatter.ISO_LOCAL_DATE,
        DateTimeFormatter.ofPattern("M/d/uuuu", Locale.US),
        DateTimeFormatter.ofPattern("M/d/uu", Locale.US),
        DateTimeFormatter.ofPattern("MM/dd/uuuu", Locale.US),
        DateTimeFormatter.ofPattern("MM/dd/uu", Locale.US)
    );

    private final WorkRequestRepo workRequestRepo;
    private final NgValueService valueService;
    private final WorkRequestSharePointAdapter wrAdapter;
    private final SyncConfig syncConfig;
    @Lazy private final CentralSyncService centralSyncService;

    @Scheduled(fixedDelay = 3600000, initialDelay = 60000) // every hour, 1 min initial delay
    @Transactional
    public void expireOverdueWorkRequests() {
        boolean shouldRunLocally = syncConfig.isHubMode() || !centralSyncService.isServerAvailable();
        if (!shouldRunLocally) {
            log.debug("[WR Expiry] Skipping local expiry because hub/server is available");
            return;
        }

        List<WorkRequest> activeWrs = workRequestRepo.findByPermitStatus_NameIgnoreCase("Active");
        LocalDate today = LocalDate.now(ZoneId.of("America/Chicago"));
        int expired = 0;

        for (WorkRequest wr : activeWrs) {
            LocalDate workDate = parseDate(wr.getDateOfWorkToBePerformed());
            if (workDate != null && !workDate.plusDays(1).isAfter(today)) {
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
        String trimmed = dateStr.trim();

        if (trimmed.contains("T")) {
            try {
                return LocalDateTime.parse(trimmed.replace("Z", "")).toLocalDate();
            } catch (DateTimeParseException ignored) {
                String datePart = trimmed.split("T", 2)[0];
                if (!datePart.isBlank()) {
                    trimmed = datePart;
                }
            }
        }

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(trimmed, formatter);
            } catch (DateTimeParseException ignored) {
                // Try the next supported date format.
            }
        }

        log.warn("[WR Expiry] Failed to parse date '{}'", dateStr);
        return null;
    }
}
