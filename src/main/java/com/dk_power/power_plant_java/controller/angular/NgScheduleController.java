package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.users.ScheduleImportRequest;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.sevice.schedule.NgCoverageService;
import com.dk_power.power_plant_java.sevice.users.LocalScheduleHeartbeatCache;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/ng/schedule")
@RequiredArgsConstructor
@Slf4j
public class NgScheduleController {

    private final ShiftDayService shiftDayService;
    private final LocalScheduleHeartbeatCache heartbeatCache;
    private final SyncConfig syncConfig;
    private final NgCoverageService coverageService;

    /**
     * Receives the parsed Ops Schedule from the Electron desktop app (the single, battle-tested
     * parser) and pivots person-rows into per-day {@link ShiftDayDto} rows; replicated to other
     * nodes via the sync system. Wired from electron-manager personnel.manager.ts.
     */
    @PostMapping("/sync")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> sync(@RequestBody ScheduleImportRequest request) {
        try {
            int rows = shiftDayService.importSchedule(request);

            // Coordination heartbeat: record locally + forward to hub so peer desktops can skip
            // their own SP round-trip. Two-phase so a hub outage doesn't lose the local signal.
            Instant now = Instant.now();
            String source = safeSource(request);
            heartbeatCache.recordLocalCheck(now, source);
            forwardHeartbeatToHub(now, source);

            return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("rowsWritten", rows, "source", request.getSource()),
                    "Schedule imported"));
        } catch (Exception e) {
            log.error("[Schedule] Import failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private String safeSource(ScheduleImportRequest request) {
        String s = request == null ? null : request.getSource();
        String m = syncConfig.getMachineName();
        if (s == null || s.isBlank()) return m;
        if (m == null || m.isBlank()) return s;
        return s + "@" + m;
    }

    /**
     * Fire-and-forget POST to hub's heartbeat endpoint. When this node IS the hub, the endpoint
     * receives our own message and updates hub state directly. When we're a desktop and the hub
     * is down/unreachable, we swallow the failure — the local cache remains authoritative for
     * this desktop's own freshness gate.
     */
    private void forwardHeartbeatToHub(Instant checkedAt, String source) {
        if (!syncConfig.isServerSyncConfigured()) return;
        String hubUrl = syncConfig.getSyncServerUrl();
        if (hubUrl == null || hubUrl.isBlank()) return;
        try {
            RestClient.create().post()
                    .uri(URI.create(hubUrl.replaceAll("/$", "") + "/api/hub/schedule/heartbeat"))
                    .body(Map.of(
                            "checkedAt", checkedAt.toString(),
                            "source", source == null ? "unknown" : source))
                    .retrieve()
                    .toBodilessEntity();
            log.debug("[Schedule] Heartbeat forwarded to hub");
        } catch (Exception e) {
            log.debug("[Schedule] Heartbeat forward to hub failed (non-fatal): {}", e.getMessage());
        }
    }

    @GetMapping("/by-date")
    public ResponseEntity<NgApiResponse<ShiftDayDto>> byDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ShiftDayDto dto = shiftDayService.getByDate(date);
        return dto == null
                ? ResponseEntity.ok(new NgApiResponse<>(null, "No schedule for date"))
                : ResponseEntity.ok(new NgApiResponse<>(dto, "Schedule retrieved"));
    }

    @GetMapping("/range")
    public ResponseEntity<NgApiResponse<List<ShiftDayDto>>> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<ShiftDayDto> rows = shiftDayService.getRange(from, to);
        return ResponseEntity.ok(new NgApiResponse<>(rows, "Schedule range retrieved"));
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<NgApiResponse<List<ShiftDayDto>>> year(@PathVariable int year) {
        List<ShiftDayDto> rows = shiftDayService.getYear(year);
        return ResponseEntity.ok(new NgApiResponse<>(rows, "Schedule year retrieved"));
    }

    /**
     * Coverage eligibility per day: {@code date → userIds} of people off + qualified to cover an open
     * need (Lead→CRO→AO hierarchy). Reachable by the Electron desktop widget (same /ng/schedule auth).
     */
    @GetMapping("/coverage-eligibility")
    public ResponseEntity<NgApiResponse<Map<String, List<Long>>>> coverageEligibility(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Map<String, List<Long>> out = new HashMap<>();
        coverageService.eligibleCoverersByDate(from, to)
                .forEach((d, ids) -> out.put(d.toString(), new ArrayList<>(ids)));
        return ResponseEntity.ok(new NgApiResponse<>(out, "Coverage eligibility"));
    }

    /**
     * Schedule freshness for the Electron auto-refresh gate. Returns the age (in seconds) of
     * whichever coordination signal is freshest:
     *
     * <ul>
     *   <li>{@code heartbeatAgeSeconds} — most recent SP verification reported by ANY desktop
     *       (via the hub heartbeat + SSE broadcast). This is the primary signal because it fires
     *       even when the schedule hasn't changed, which is the common case.</li>
     *   <li>{@code dataAgeSeconds} — most recent {@code shift_days.date_modified}. Fallback for
     *       when the heartbeat cache is cold (fresh restart, no SSE yet).</li>
     *   <li>{@code ageSeconds} — MIN of the two (i.e. the freshest signal). Electron gates on
     *       this: if smaller than the configured interval, skip the SP pull.</li>
     * </ul>
     */
    @GetMapping("/freshness")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> freshness() {
        Map<String, Object> payload = new HashMap<>();
        LocalDateTime latestModified = shiftDayService.getMaxDateModified();
        Long dataAgeSec = latestModified == null ? null :
                Duration.between(latestModified, LocalDateTime.now()).getSeconds();
        payload.put("latestModified", latestModified == null ? null : latestModified.toString());
        payload.put("dataAgeSeconds", dataAgeSec);

        Instant heartbeat = heartbeatCache.getLatestCheckAt();
        Long heartbeatAgeSec = heartbeat == null ? null :
                Duration.between(heartbeat, Instant.now()).getSeconds();
        payload.put("latestHeartbeat", heartbeat == null ? null : heartbeat.toString());
        payload.put("heartbeatSource", heartbeatCache.getLatestSource());
        payload.put("heartbeatAgeSeconds", heartbeatAgeSec);

        Long freshest = null;
        if (heartbeatAgeSec != null) freshest = heartbeatAgeSec;
        if (dataAgeSec != null && (freshest == null || dataAgeSec < freshest)) freshest = dataAgeSec;
        payload.put("ageSeconds", freshest);

        return ResponseEntity.ok(new NgApiResponse<>(payload, "Freshness"));
    }

    @GetMapping("/unresolved")
    public ResponseEntity<NgApiResponse<Set<String>>> unresolved(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Set<String> names = shiftDayService.unresolvedNames(from, to);
        return ResponseEntity.ok(new NgApiResponse<>(names, "Unresolved names"));
    }
}
