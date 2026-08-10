package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.sevice.sync.DataIntegrityService;
import com.dk_power.power_plant_java.sevice.sync.DataIntegrityService.IntegrityCheckResult;
import com.dk_power.power_plant_java.sevice.sync.DataIntegrityService.IntegrityFixResult;
import com.dk_power.power_plant_java.sevice.sync.NaturalKeyDivergenceReconciler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for data integrity check and fix operations.
 *
 * Provides endpoints to:
 * - Check for integrity issues (duplicates, orphans, missing constraints)
 * - Fix issues with dry-run support
 * - Purge soft-deleted entities
 */
@RestController
@RequestMapping("/api/data-integrity")
@RequiredArgsConstructor
@Slf4j
public class DataIntegrityController {

    private final DataIntegrityService dataIntegrityService;
    private final NaturalKeyDivergenceReconciler naturalKeyDivergenceReconciler;

    /**
     * Check all integrity issues (read-only).
     */
    @GetMapping("/check")
    public ResponseEntity<IntegrityCheckResult> checkIntegrity() {
        log.info("Integrity check requested");
        IntegrityCheckResult result = dataIntegrityService.checkIntegrity();
        return ResponseEntity.ok(result);
    }

    /**
     * Fix duplicate join table entries.
     *
     * @param dryRun If true (default), only report what would be fixed
     */
    @PostMapping("/fix/duplicates")
    public ResponseEntity<IntegrityFixResult> fixDuplicates(
            @RequestParam(defaultValue = "true") boolean dryRun) {
        log.info("Fix duplicates requested (dryRun={})", dryRun);
        IntegrityFixResult result = dataIntegrityService.fixDuplicates(dryRun);
        return ResponseEntity.ok(result);
    }

    /**
     * Fix orphaned FK references.
     *
     * @param dryRun If true (default), only report what would be fixed
     */
    @PostMapping("/fix/orphans")
    public ResponseEntity<IntegrityFixResult> fixOrphans(
            @RequestParam(defaultValue = "true") boolean dryRun) {
        log.info("Fix orphans requested (dryRun={})", dryRun);
        IntegrityFixResult result = dataIntegrityService.fixOrphanedReferences(dryRun);
        return ResponseEntity.ok(result);
    }

    /**
     * Add missing primary key constraints to join tables.
     *
     * @param dryRun If true (default), only report what would be added
     */
    @PostMapping("/fix/constraints")
    public ResponseEntity<IntegrityFixResult> addConstraints(
            @RequestParam(defaultValue = "true") boolean dryRun) {
        log.info("Add constraints requested (dryRun={})", dryRun);
        IntegrityFixResult result = dataIntegrityService.addPrimaryKeyConstraints(dryRun);
        return ResponseEntity.ok(result);
    }

    /**
     * Fix all issues at once (duplicates, orphans, constraints).
     * Does NOT purge soft-deleted entities.
     *
     * @param dryRun If true (default), only report what would be fixed
     */
    @PostMapping("/fix/all")
    public ResponseEntity<IntegrityFixResult> fixAll(
            @RequestParam(defaultValue = "true") boolean dryRun) {
        log.info("Fix all requested (dryRun={})", dryRun);
        IntegrityFixResult result = dataIntegrityService.fixAll(dryRun);
        return ResponseEntity.ok(result);
    }

    /**
     * Permanently delete soft-deleted entities older than retention period.
     *
     * @param dryRun If true (default), only report what would be deleted
     * @param retentionDays Minimum age of soft-deleted entities to purge (default 90)
     */
    @PostMapping("/fix/purge-deleted")
    public ResponseEntity<IntegrityFixResult> purgeDeleted(
            @RequestParam(defaultValue = "true") boolean dryRun,
            @RequestParam(defaultValue = "90") int retentionDays) {
        log.info("Purge deleted requested (dryRun={}, retentionDays={})", dryRun, retentionDays);
        IntegrityFixResult result = dataIntegrityService.purgeSoftDeleted(dryRun, retentionDays);
        return ResponseEntity.ok(result);
    }

    /**
     * Heal Category/Value duplicate divergence that predates the deterministic dedup path
     * ({@code sync.dedup.deterministic-convergence.enabled}): re-create the smaller-id survivor wherever
     * this hub kept the larger id, then run the deterministic merge to converge + emit synced changes.
     * HUB-ONLY (no-ops on a client). Run ONLY after every client is on the deterministic-dedup jar — a
     * client on the old jar would mishandle the corrections. Relocated here from the (prod-excluded)
     * SyncE2ETestController so it has a stable, non-test home in production.
     */
    @PostMapping("/reconcile-natural-key-divergence")
    public ResponseEntity<NaturalKeyDivergenceReconciler.ReconcileResult> reconcileNaturalKeyDivergence() {
        log.info("Natural-key divergence reconcile requested");
        return ResponseEntity.ok(naturalKeyDivergenceReconciler.reconcile());
    }
}
