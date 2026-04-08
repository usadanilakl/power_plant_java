package com.dk_power.power_plant_java.controller.angular.admin;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.admin.SyncAuditEntityReportDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditIncidentReportRequestDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditMachineCompareReportDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditRecentEntityDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditReconstructionDto;
import com.dk_power.power_plant_java.dto.admin.SyncAuditTypeSummaryDto;
import com.dk_power.power_plant_java.sevice.angular.admin.AdminFunctionalitiesService;
import com.dk_power.power_plant_java.sevice.angular.admin.SyncAuditService;
import com.dk_power.power_plant_java.sevice.hub.H2ToPostgresMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/admin")
@RequiredArgsConstructor
public class NgAdminFunctionalitiesController {
    private final AdminFunctionalitiesService adminFunctionalitiesService;
    private final SyncAuditService syncAuditService;
    private final H2ToPostgresMigrationService migrationService;

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

    @GetMapping("/sync-audit/types")
    public ResponseEntity<NgApiResponse<List<SyncAuditTypeSummaryDto>>> getSyncAuditTypes() {
        try {
            List<SyncAuditTypeSummaryDto> result = syncAuditService.getTypeSummaries();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Sync audit entity types retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error loading sync audit types: " + e.getMessage()));
        }
    }

    @GetMapping("/sync-audit/recent")
    public ResponseEntity<NgApiResponse<List<SyncAuditRecentEntityDto>>> getRecentSyncAuditEntities(
            @RequestParam String entityType,
            @RequestParam(defaultValue = "25") int limit,
            @RequestParam(required = false) String machineId,
            @RequestParam(required = false) String fieldName,
            @RequestParam(required = false) String changeType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        try {
            List<SyncAuditRecentEntityDto> result = syncAuditService.getRecentEntities(entityType, limit, machineId, fieldName, changeType, from, to);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Recent sync-audited entities retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error loading recent sync-audited entities: " + e.getMessage()));
        }
    }

    @GetMapping("/sync-audit/entity")
    public ResponseEntity<NgApiResponse<SyncAuditEntityReportDto>> getSyncAuditEntityReport(
            @RequestParam String entityType,
            @RequestParam Long entityId,
            @RequestParam(defaultValue = "200") int limit,
            @RequestParam(required = false) String machineId,
            @RequestParam(required = false) String fieldName,
            @RequestParam(required = false) String changeType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        try {
            SyncAuditEntityReportDto result = syncAuditService.getEntityReport(entityType, entityId, limit, machineId, fieldName, changeType, from, to);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Sync audit entity report retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error loading sync audit entity report: " + e.getMessage()));
        }
    }

    @GetMapping("/sync-audit/export")
    public ResponseEntity<String> exportSyncAuditEntityReport(
            @RequestParam String entityType,
            @RequestParam Long entityId,
            @RequestParam(defaultValue = "200") int limit,
            @RequestParam(required = false) String machineId,
            @RequestParam(required = false) String fieldName,
            @RequestParam(required = false) String changeType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        try {
            String body = syncAuditService.exportEntityReportAsJson(entityType, entityId, limit, machineId, fieldName, changeType, from, to);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sync-audit-" + entityType + "-" + entityId + ".json\"")
                .body(body);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .contentType(MediaType.TEXT_PLAIN)
                .body("Error exporting sync audit entity report: " + e.getMessage());
        }
    }

    @GetMapping("/sync-audit/compare-machines")
    public ResponseEntity<NgApiResponse<SyncAuditMachineCompareReportDto>> compareSyncAuditMachines(
            @RequestParam String entityType,
            @RequestParam String leftMachineId,
            @RequestParam String rightMachineId,
            @RequestParam(defaultValue = "200") int limit,
            @RequestParam(required = false) String fieldName,
            @RequestParam(required = false) String changeType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        try {
            SyncAuditMachineCompareReportDto result = syncAuditService.compareMachines(entityType, leftMachineId, rightMachineId, limit, fieldName, changeType, from, to);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Sync audit machine comparison retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error comparing sync audit machines: " + e.getMessage()));
        }
    }

    @GetMapping("/sync-audit/reconstruct")
    public ResponseEntity<NgApiResponse<SyncAuditReconstructionDto>> reconstructSyncAuditEntity(
            @RequestParam String entityType,
            @RequestParam Long entityId,
            @RequestParam String asOf) {
        try {
            SyncAuditReconstructionDto result = syncAuditService.reconstructEntityAtTime(entityType, entityId, asOf);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Point-in-time reconstruction retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error reconstructing sync audit entity: " + e.getMessage()));
        }
    }

    // ==================== Database Migration ====================

    @GetMapping("/migration/status")
    public ResponseEntity<NgApiResponse<H2ToPostgresMigrationService.MigrationStatus>> getMigrationStatus() {
        try {
            var status = migrationService.getStatus();
            return ResponseEntity.ok(new NgApiResponse<>(status, "Migration status retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Error checking migration status: " + e.getMessage()));
        }
    }

    @GetMapping("/migration/compare")
    public ResponseEntity<NgApiResponse<H2ToPostgresMigrationService.MigrationReport>> compareMigration() {
        try {
            var report = migrationService.compareSourceAndTarget();
            if (report.getError() != null) {
                return ResponseEntity.status(500)
                    .body(new NgApiResponse<>(report, "Comparison failed: " + report.getError()));
            }
            String message = report.getTotalDeviations() == 0
                ? "All tables match (" + report.getTotalPgRecords() + " records)"
                : report.getTotalDeviations() + " table(s) have deviations";
            return ResponseEntity.ok(new NgApiResponse<>(report, message));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Comparison error: " + e.getMessage()));
        }
    }

    @PostMapping("/migration/run")
    public ResponseEntity<NgApiResponse<H2ToPostgresMigrationService.MigrationResult>> runMigration() {
        try {
            var result = migrationService.migrate();
            String message = result.isSuccess()
                ? "Migration complete: " + result.getTotalRecords() + " records in " + result.getElapsedMs() + "ms"
                : "Migration failed: " + result.getError();
            return ResponseEntity.ok(new NgApiResponse<>(result, message));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, "Migration error: " + e.getMessage()));
        }
    }

    @GetMapping("/sync-audit/incident-report")
    public ResponseEntity<String> exportSyncAuditIncidentReport(
            @RequestParam String entityType,
            @RequestParam Long entityId,
            @RequestParam(defaultValue = "200") int limit,
            @RequestParam(required = false) String machineId,
            @RequestParam(required = false) String fieldName,
            @RequestParam(required = false) String changeType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String leftMachineId,
            @RequestParam(required = false) String rightMachineId,
            @RequestParam(defaultValue = "200") int compareLimit,
            @RequestParam(required = false) String asOf) {
        try {
            String body = syncAuditService.exportIncidentReportAsJson(new SyncAuditIncidentReportRequestDto(
                entityType, entityId, limit, machineId, fieldName, changeType, from, to,
                leftMachineId, rightMachineId, compareLimit, asOf
            ));
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sync-incident-" + entityType + "-" + entityId + ".json\"")
                .body(body);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .contentType(MediaType.TEXT_PLAIN)
                .body("Error exporting sync audit incident report: " + e.getMessage());
        }
    }
}
