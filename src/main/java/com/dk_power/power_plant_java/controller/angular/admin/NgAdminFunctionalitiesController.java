package com.dk_power.power_plant_java.controller.angular.admin;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.sevice.angular.admin.AdminFunctionalitiesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ng/admin")
@RequiredArgsConstructor
public class NgAdminFunctionalitiesController {
    private final AdminFunctionalitiesService adminFunctionalitiesService;

    /**
     * Check file integrity - compares physical files with database entries.
     * @param dryRun If true, only reports issues without making changes
     * @return Report of orphaned files and missing database entries
     */
    @PostMapping("/restore-file-integrity")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> restoreFileIntegrity(
            @RequestParam(defaultValue = "true") boolean dryRun) {
        try {
            Map<String, Object> result = adminFunctionalitiesService.restoreFileIntegrity(dryRun);
            String message = dryRun
                ? "File integrity check completed (dry run)"
                : "File integrity restoration completed";
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, message));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error checking file integrity: " + e.getMessage()));
        }
    }

    /**
     * Split equipment with multiple loto points into separate equipment entries.
     * Each equipment will have exactly one loto point after this operation.
     */
    @PostMapping("/split-equipment")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> splitEquipmentWithMultipleLotoPoints() {
        try {
            Map<String, Object> result = adminFunctionalitiesService.splitAllEquipmentWithMultipleLotoPoints();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Equipment split operation completed"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error splitting equipment: " + e.getMessage()));
        }
    }

    /**
     * Assign Location and EqType from Equipment to their associated LotoPoints.
     */
    @PostMapping("/assign-equipment-attributes")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> assignEquipmentAttributesToLotoPoints() {
        try {
            Map<String, Object> result = adminFunctionalitiesService.assignEquipmentAttributesToLotoPoints();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Attribute assignment completed"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error assigning attributes: " + e.getMessage()));
        }
    }

    /**
     * Associate LotoPoints with their unit counterparts (U1/U2).
     * Finds pairs of loto points where tag numbers differ only in the unit prefix (01 vs 02).
     * @param dryRun If true, only reports what would be linked without making changes
     */
    @PostMapping("/associate-counterparts")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> associateLotoPointCounterparts(
            @RequestParam(defaultValue = "true") boolean dryRun) {
        try {
            Map<String, Object> result = adminFunctionalitiesService.associateLotoPointCounterparts(dryRun);
            String message = dryRun
                ? "Counterpart association check completed (dry run)"
                : "Counterpart association completed";
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, message));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error associating counterparts: " + e.getMessage()));
        }
    }
}
