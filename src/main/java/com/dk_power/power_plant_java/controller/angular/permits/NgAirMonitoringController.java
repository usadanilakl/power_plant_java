package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
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

/** Air monitoring: which places need testing, and the readings taken against them. */
@Slf4j
@RestController
@RequestMapping("/ng/air-monitoring")
@RequiredArgsConstructor
public class NgAirMonitoringController {

    private final NgAirMonitoringService service;

    @GetMapping("/areas")
    public ResponseEntity<NgApiResponse<List<MonitoredAreaDto>>> areas(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        try {
            List<MonitoredAreaDto> areas = service.list(includeInactive);
            return ResponseEntity.ok(new NgApiResponse<>(areas, areas.size() + " area(s)"));
        } catch (Exception e) {
            log.error("[AirMonitoring] Failed to list areas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Error listing areas: " + e.getMessage()));
        }
    }

    /** Rebuild the derived entries from the currently open Confined Space and Hot Work permits. */
    @PostMapping("/refresh")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> refresh() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.refreshFromPermits(), "Refreshed."));
        } catch (Exception e) {
            log.error("[AirMonitoring] Refresh failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Error refreshing: " + e.getMessage()));
        }
    }

    @PostMapping("/areas")
    public ResponseEntity<NgApiResponse<MonitoredAreaDto>> saveArea(@RequestBody MonitoredAreaDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.save(dto), "Saved."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error saving: " + e.getMessage()));
        }
    }

    /** Take an area off the list. Flagged, not deleted — its tests stay reachable. */
    @DeleteMapping("/areas/{id}")
    public ResponseEntity<NgApiResponse<String>> removeArea(@PathVariable Long id) {
        try {
            service.remove(id);
            return ResponseEntity.ok(new NgApiResponse<>("Removed", "Removed from the list."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error removing: " + e.getMessage()));
        }
    }

    @PostMapping("/areas/{id}/restore")
    public ResponseEntity<NgApiResponse<String>> restoreArea(@PathVariable Long id) {
        try {
            service.restore(id);
            return ResponseEntity.ok(new NgApiResponse<>("Restored", "Back on the list."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error restoring: " + e.getMessage()));
        }
    }

    @GetMapping("/areas/{id}/tests")
    public ResponseEntity<NgApiResponse<List<AirTestDto>>> tests(@PathVariable Long id) {
        try {
            List<AirTestDto> tests = service.testsFor(id);
            return ResponseEntity.ok(new NgApiResponse<>(tests, tests.size() + " test(s)"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/tests")
    public ResponseEntity<NgApiResponse<AirTestDto>> recordTest(@RequestBody AirTestDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.recordTest(dto), "Test recorded."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[AirMonitoring] Failed to record test", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Error recording test: " + e.getMessage()));
        }
    }
}
