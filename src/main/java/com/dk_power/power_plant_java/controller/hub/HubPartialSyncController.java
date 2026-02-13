package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.sevice.hub.HubFieldChangeQueryService;
import com.dk_power.power_plant_java.sevice.hub.HubHealthStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

/**
 * Hub controller for health stats and partial sync endpoints.
 * Matches sync-server's SyncController API contract for these features.
 * Uses /api/sync base path with non-overlapping endpoint paths from HubSyncController.
 * Only active when sync.role=hub.
 */
@RestController
@RequestMapping("/api/sync")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubPartialSyncController {

    private final HubHealthStatsService healthStatsService;
    private final HubFieldChangeQueryService fieldChangeQueryService;

    @GetMapping("/health-stats")
    public ResponseEntity<HubHealthStatsService.HealthStats> getHealthStats(
            @RequestHeader(value = "X-Machine-Id", required = false) String machineId) {
        HubHealthStatsService.HealthStats stats = healthStatsService.getHealthStats();
        log.debug("Health stats requested by {}: entities={}, files={}",
            machineId, stats.getTotalEntities(), stats.getFileCount());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/partial-sync/available-dates")
    public ResponseEntity<HubHealthStatsService.PartialSyncDatesResponse> getAvailableSyncDates() {
        log.info("Getting available sync dates for partial sync");
        HubHealthStatsService.PartialSyncDatesResponse response = healthStatsService.getAvailableSyncDates();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/partial-sync/count")
    public ResponseEntity<Map<String, Object>> getChangeCountSinceDate(@RequestParam String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            Instant since = localDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
            long count = fieldChangeQueryService.countChangesSince(since);
            return ResponseEntity.ok(Map.of(
                "date", date,
                "changeCount", count,
                "since", since.toString()
            ));
        } catch (Exception e) {
            log.error("Error getting change count for date {}: {}", date, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/partial-sync/changes")
    public ResponseEntity<List<FieldChange>> getChangesSinceDate(
            @RequestParam String date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "500") int size) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            Instant since = localDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
            int safeSize = Math.min(size, 1000);

            Page<FieldChange> changePage = fieldChangeQueryService.findChangesSincePaginated(
                since, PageRequest.of(page, safeSize));

            log.debug("Partial sync changes: date={}, page={}, size={}, returned={}, hasMore={}",
                date, page, safeSize, changePage.getNumberOfElements(), changePage.hasNext());

            return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(changePage.getTotalElements()))
                .header("X-Total-Pages", String.valueOf(changePage.getTotalPages()))
                .header("X-Has-More", String.valueOf(changePage.hasNext()))
                .header("X-Page", String.valueOf(page))
                .header("X-Since", since.toString())
                .body(changePage.getContent());
        } catch (Exception e) {
            log.error("Error getting changes for date {}: {}", date, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
