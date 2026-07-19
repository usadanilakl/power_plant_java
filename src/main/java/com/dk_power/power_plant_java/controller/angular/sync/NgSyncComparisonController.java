package com.dk_power.power_plant_java.controller.angular.sync;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.sevice.sync.EntityVerificationService;
import com.dk_power.power_plant_java.sevice.sync.EntityVerificationService.*;
import com.dk_power.power_plant_java.sevice.sync.SyncComparisonService;
import com.dk_power.power_plant_java.sevice.sync.SyncComparisonService.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Angular-facing controller for sync comparison and 3-way verification.
 * Provides local-vs-hub comparison (2-way) and local+hub+SharePoint verification (3-way).
 */
@RestController
@RequestMapping("/ng/sync/compare")
@RequiredArgsConstructor
@Slf4j
public class NgSyncComparisonController {

    private final SyncComparisonService syncComparisonService;
    private final EntityVerificationService entityVerificationService;

    // ==================== Existing 2-way comparison ====================
    // NOTE: the timestamp-based /entity-types and /scan-all endpoints were removed with the old
    // Compare panel — the Drift Center's content-hash scan (/content/*) is the convergence oracle now.

    /**
     * Inc 0b harness — CONTENT drift (hash of synced fields), not just ids/timestamps. Cheap per-type
     * digest probe; drills into differing rows only on mismatch. Report-only; supersedes the ±5s
     * timestamp heuristic as the convergence oracle.
     */
    @GetMapping("/content/scan-all")
    public ResponseEntity<NgApiResponse<List<ContentDriftSummary>>> scanAllContent() {
        try {
            List<ContentDriftSummary> drift = syncComparisonService.scanAllTypesForContentDrift();
            return ResponseEntity.ok(new NgApiResponse<>(drift,
                "Scanned all entity types for content drift: " + drift.size() + " diverging"));
        } catch (Exception e) {
            log.error("Content drift scan-all failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Scan failed: " + e.getMessage()));
        }
    }

    @GetMapping("/content/{entityType}")
    public ResponseEntity<NgApiResponse<ContentDriftSummary>> compareContent(
            @PathVariable String entityType) {
        try {
            ContentDriftSummary result = syncComparisonService.compareEntityTypeByContent(entityType);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Content comparison complete"));
        } catch (Exception e) {
            log.error("Content comparison failed for {}: {}", entityType, e.getMessage(), e);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Comparison failed: " + e.getMessage()));
        }
    }

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

    // ==================== 3-way verification (local + hub + SP) ====================

    /**
     * Full 3-way verification for an entity type.
     * Optionally pass a list of entity IDs to check only those.
     */
    @PostMapping("/verify/{entityType}")
    public ResponseEntity<NgApiResponse<VerificationResult>> verify(
            @PathVariable String entityType,
            @RequestBody(required = false) List<Long> entityIds) {
        try {
            VerificationResult result = entityVerificationService.verify(entityType, entityIds);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("Verification failed for {}: {}", entityType, e.getMessage(), e);
            return ResponseEntity.ok(
                new NgApiResponse<>(null, "Verification failed: " + e.getMessage()));
        }
    }

    /**
     * 3-way field-level diff for a single entity.
     * Returns local, hub, and SP values side by side.
     */
    @GetMapping("/verify/{entityType}/{entityId}/diff")
    public ResponseEntity<NgApiResponse<ThreeWayFieldDiff>> threeWayDiff(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            ThreeWayFieldDiff diff = entityVerificationService.threeWayFieldDiff(entityType, entityId);
            return ResponseEntity.ok(new NgApiResponse<>(diff,
                diff.getMismatchCount() == 0 ? "All fields match" : diff.getMismatchCount() + " mismatches"));
        } catch (Exception e) {
            log.error("3-way diff failed for {}#{}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.ok(
                new NgApiResponse<>(null, "3-way diff failed: " + e.getMessage()));
        }
    }
}
