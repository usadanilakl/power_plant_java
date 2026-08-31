package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.dto.permits.AirTestDto;
import com.dk_power.power_plant_java.dto.permits.MonitoredAreaDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgAirMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Air monitoring from the field.
 *
 * <p>Read the list, record a reading. Nothing else — an area is added or removed on the desktop,
 * where the person doing it can see the permits it was derived from.
 *
 * <p>The hub is the authoritative writer. A phone with no signal queues the reading locally and
 * posts it on reconnect, which is why {@code testedAt} is part of the payload rather than stamped
 * on arrival: a reading taken in a basement at 06:00 and synced at 14:00 has to keep 06:00, or the
 * record becomes a lie about when the atmosphere was safe.
 */
@Slf4j
@RestController
@RequestMapping("/api/pwa/secured/air-monitoring")
@RequiredArgsConstructor
public class PwaAirMonitoringController {

    private final NgAirMonitoringService service;

    @GetMapping("/areas")
    public ResponseEntity<Map<String, Object>> areas() {
        try {
            List<MonitoredAreaDto> areas = service.list(false);
            return ResponseEntity.ok(Map.of("success", true, "areas", areas));
        } catch (Exception e) {
            log.error("[PWA AirMonitoring] Failed to list areas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Could not load the list: " + e.getMessage()));
        }
    }

    @GetMapping("/areas/{id}/tests")
    public ResponseEntity<Map<String, Object>> tests(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(Map.of("success", true, "tests", service.testsFor(id)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", String.valueOf(e.getMessage())));
        }
    }

    @PostMapping("/tests")
    public ResponseEntity<Map<String, Object>> recordTest(@RequestBody AirTestDto dto) {
        try {
            AirTestDto saved = service.recordTest(dto);
            return ResponseEntity.ok(Map.of("success", true, "test", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", String.valueOf(e.getMessage())));
        } catch (Exception e) {
            log.error("[PWA AirMonitoring] Failed to record test", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Could not record the test: " + e.getMessage()));
        }
    }
}
