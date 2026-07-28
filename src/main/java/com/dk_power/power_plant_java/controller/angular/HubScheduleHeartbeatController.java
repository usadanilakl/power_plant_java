package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.sevice.users.HubScheduleHeartbeatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Hub-only endpoints for the shared "someone just verified SharePoint schedule" heartbeat.
 * Desktops POST here after each successful {@code /ng/schedule/sync} import (whether or not the
 * data actually changed), so peers can skip redundant SP round-trips when the schedule has been
 * confirmed fresh recently.
 */
@Slf4j
@RestController
@RequestMapping("/api/hub/schedule/heartbeat")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
public class HubScheduleHeartbeatController {

    private final HubScheduleHeartbeatService service;

    /**
     * Report a verification event. Body: {@code {checkedAt: ISO string, source: "machine-name"}}.
     * Missing/invalid {@code checkedAt} is treated as "now" — the goal is a coordination signal,
     * not audit precision.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> report(@RequestBody(required = false) Map<String, Object> body) {
        Instant checkedAt = null;
        String source = null;
        if (body != null) {
            Object at = body.get("checkedAt");
            if (at instanceof String s && !s.isBlank()) {
                try { checkedAt = Instant.parse(s); } catch (Exception ignored) { }
            }
            Object src = body.get("source");
            if (src instanceof String s) source = s;
        }
        service.recordHeartbeat(checkedAt != null ? checkedAt : Instant.now(), source);
        return ResponseEntity.ok(Map.of("accepted", true));
    }

    /**
     * Current heartbeat status. Returns {@code {lastCheckedAt, ageSeconds, source}} or
     * {@code {lastCheckedAt: null}} if none recorded yet.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> status() {
        Instant latest = service.getLatestCheckAt();
        Map<String, Object> payload = new LinkedHashMap<>();
        if (latest == null) {
            payload.put("lastCheckedAt", null);
            payload.put("ageSeconds", null);
        } else {
            payload.put("lastCheckedAt", latest.toString());
            payload.put("ageSeconds", Duration.between(latest, Instant.now()).getSeconds());
        }
        payload.put("source", service.getLatestSource());
        return ResponseEntity.ok(payload);
    }
}
