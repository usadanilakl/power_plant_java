package com.dk_power.power_plant_java.controller.angular.sync;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.sevice.sync.SyncComparisonService;
import com.dk_power.power_plant_java.sevice.sync.SyncComparisonService.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Angular-facing controller for sync comparison operations.
 * Allows the frontend to compare local entities against the hub
 * and view field-level diffs.
 */
@RestController
@RequestMapping("/ng/sync/compare")
@RequiredArgsConstructor
@Slf4j
public class NgSyncComparisonController {

    private final SyncComparisonService syncComparisonService;

    /**
     * Get all entity types with their local counts for the comparison UI.
     */
    @GetMapping("/entity-types")
    public ResponseEntity<NgApiResponse<List<EntityTypeSummary>>> getEntityTypes() {
        List<EntityTypeSummary> summaries = syncComparisonService.getAllEntityTypeSummaries();
        return ResponseEntity.ok(new NgApiResponse<>(summaries, "Entity type summaries"));
    }

    /**
     * Compare a specific entity type: local IDs vs server IDs.
     * Returns which IDs are local-only, server-only, and stale common records.
     */
    @GetMapping("/{entityType}")
    public ResponseEntity<NgApiResponse<EntityComparisonResult>> compareEntityType(
            @PathVariable String entityType) {
        try {
            EntityComparisonResult result = syncComparisonService.compareEntityType(entityType);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Comparison complete"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("Comparison failed for {}: {}", entityType, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Comparison failed: " + e.getMessage()));
        }
    }

    @GetMapping("/check/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<EntitySyncStatus>> checkEntitySync(
            @PathVariable String entityType, @PathVariable Long entityId) {
        try {
            EntitySyncStatus status = syncComparisonService.checkEntitySync(entityType, entityId);
            return ResponseEntity.ok(new NgApiResponse<>(status, status.getStatus()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("Sync check failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Check failed: " + e.getMessage()));
        }
    }

    @PostMapping("/check/{entityType}")
    public ResponseEntity<NgApiResponse<List<EntitySyncStatus>>> checkEntitiesSync(
            @PathVariable String entityType, @RequestBody List<Long> entityIds) {
        try {
            List<EntitySyncStatus> results = syncComparisonService.checkEntitiesSync(entityType, entityIds);
            return ResponseEntity.ok(new NgApiResponse<>(results, "Batch check complete"));
        } catch (Exception e) {
            log.error("Batch sync check failed for {}: {}", entityType, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Batch check failed: " + e.getMessage()));
        }
    }

    /**
     * Compare a single entity field-by-field: local vs server values.
     */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<EntityFieldDiff>> compareEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            EntityFieldDiff diff = syncComparisonService.compareEntity(entityType, entityId);
            return ResponseEntity.ok(new NgApiResponse<>(diff, "Field diff complete"));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("Field diff failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Diff failed: " + e.getMessage()));
        }
    }
}
