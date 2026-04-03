package com.dk_power.power_plant_java.controller.angular.sync;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.sync.SyncAuditComparisonDto;
import com.dk_power.power_plant_java.dto.sync.SyncAuditComparisonDto.EntityTypeSummary;
import com.dk_power.power_plant_java.sevice.sync.SyncAuditPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/sync-audit")
@RequiredArgsConstructor
@Slf4j
public class NgSyncAuditController {

    private final SyncAuditPageService syncAuditPageService;

    @GetMapping("/entity-types")
    public ResponseEntity<NgApiResponse<List<EntityTypeSummary>>> getEntityTypes() {
        try {
            List<EntityTypeSummary> types = syncAuditPageService.getAuditableEntityTypes();
            return ResponseEntity.ok(new NgApiResponse<>(types, "Found " + types.size() + " entity types"));
        } catch (Exception e) {
            log.error("Error fetching entity types: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/entities/{entityType}")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getEntities(
            @PathVariable String entityType) {
        try {
            List<Map<String, Object>> entities = syncAuditPageService.getEntitiesForTable(entityType);
            return ResponseEntity.ok(new NgApiResponse<>(entities,
                "Found " + entities.size() + " " + entityType + " entities"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching entities for {}: {}", entityType, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/comparison/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<SyncAuditComparisonDto>> getComparison(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            SyncAuditComparisonDto comparison = syncAuditPageService.getComparison(entityType, entityId);
            String message = comparison.isServerReachable()
                ? "Comparison complete"
                : "Comparison complete (hub unreachable — local data only)";
            return ResponseEntity.ok(new NgApiResponse<>(comparison, message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("Error comparing {}/#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
