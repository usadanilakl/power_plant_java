package com.dk_power.power_plant_java.controller.angular.admin;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.admin.MaximoFieldListDriftDto;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFieldListDriftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoint powering the "Maximo Field List Drift" panel in JG Portal. Returns a
 * snapshot of four drift buckets — create backlog, cancel backlog, Maximo-closed/local-open,
 * and local-closed/Maximo-open — with row-level drill-down. Not gated by the Maximo feature
 * flag so the panel is always mount-able (zero counts when the feature is off).
 */
@RestController
@RequestMapping("/ng/admin/maximo-field-list-drift")
@RequiredArgsConstructor
public class NgMaximoFieldListDriftController {

    private final MaximoFieldListDriftService driftService;

    /**
     * Snapshot with per-bucket sample rows. {@code limit} caps rows per bucket (1..200,
     * default 25). Total counts always reflect the full table regardless of limit.
     */
    @GetMapping("/snapshot")
    public ResponseEntity<NgApiResponse<MaximoFieldListDriftDto>> snapshot(
            @RequestParam(defaultValue = "25") int limit) {
        try {
            MaximoFieldListDriftDto snap = driftService.snapshot(limit);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(snap, "Maximo field list drift snapshot"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error computing drift snapshot: " + e.getMessage()));
        }
    }
}
