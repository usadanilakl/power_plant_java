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
     * Fix file extensions - scans filesystem for each FileObject and updates
     * the extensions field based on which extension folders contain matching files.
     * @param dryRun If true, only reports what would change without updating
     */
    @PostMapping("/fix-file-extensions")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> fixFileExtensions(
            @RequestParam(defaultValue = "true") boolean dryRun) {
        try {
            Map<String, Object> result = adminFunctionalitiesService.fixFileExtensions(dryRun);
            String message = dryRun
                ? "File extensions check completed (dry run)"
                : "File extensions fix completed";
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, message));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error fixing file extensions: " + e.getMessage()));
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

    // ==================== Sync Queue Monitoring & Control ====================

    @GetMapping("/sync-queue/status")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getSyncQueueStatus() {
        try {
            Map<String, Object> result = adminFunctionalitiesService.getSyncQueueStatus();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Sync queue status retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error getting sync queue status: " + e.getMessage()));
        }
    }

    @PostMapping("/sync-queue/mark-synced-to-server")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> markAllSyncedToServer() {
        try {
            Map<String, Object> result = adminFunctionalitiesService.markAllSyncedToServer();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Changes marked as synced to SERVER"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/sync-queue/mark-synced")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> markAllSyncedToMachine(
            @RequestParam String machineId) {
        try {
            Map<String, Object> result = adminFunctionalitiesService.markAllSyncedToMachine(machineId);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Changes marked as synced to " + machineId));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/sync-queue/clear-old")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> clearOldChanges(
            @RequestParam(defaultValue = "30") int days) {
        try {
            Map<String, Object> result = adminFunctionalitiesService.clearOldChanges(days);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Old changes cleared"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/sync-queue/clear-all")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> clearAllChanges() {
        try {
            Map<String, Object> result = adminFunctionalitiesService.clearAllChanges();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "All changes cleared"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/pwa-sync")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> publishPwaData(
            @RequestParam(defaultValue = "all") String target) {
        try {
            Map<String, Object> result = adminFunctionalitiesService.publishPwaData(target);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "PWA sync queued"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error queuing PWA sync: " + e.getMessage()));
        }
    }
}
