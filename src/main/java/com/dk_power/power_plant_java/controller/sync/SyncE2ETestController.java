package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.sevice.sync.CategoryValueMergeService;
import com.dk_power.power_plant_java.sevice.sync.NaturalKeyDivergenceReconciler;
import com.dk_power.power_plant_java.sevice.sync.SyncE2EFileTestService;
import com.dk_power.power_plant_java.sevice.sync.SyncE2ETestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sync-e2e")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SyncE2ETestController {

    private final SyncE2ETestService syncE2ETestService;
    private final SyncE2EFileTestService syncE2EFileTestService;
    private final CategoryValueMergeService categoryValueMergeService;
    private final NaturalKeyDivergenceReconciler naturalKeyDivergenceReconciler;

    /**
     * Seed a full entity graph: Categories → Values → Equipment → LotoPoints → LotoStandards.
     * POST /api/sync-e2e/seed
     */
    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seedEntityGraph(@RequestBody Map<String, Object> request) {
        log.info("API: Seed entity graph with prefix={}", request.get("prefix"));
        Map<String, Object> result = syncE2ETestService.seedEntityGraph(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Seed duplicate Categories/Values for deduplication testing.
     * POST /api/sync-e2e/seed/dedup?prefix=SYNC_E2E_DEDUP_123
     */
    @PostMapping("/seed/dedup")
    public ResponseEntity<Map<String, Object>> seedDedupScenario(
            @RequestParam(required = false) String prefix) {
        log.info("API: Seed dedup scenario with prefix={}", prefix);
        Map<String, Object> result = syncE2ETestService.seedDedupScenario(prefix);
        return ResponseEntity.ok(result);
    }

    /**
     * Seed bulk LotoStandards with relationships for stress testing.
     * POST /api/sync-e2e/seed/bulk?count=1000&prefix=SYNC_E2E_BULK_123&lotoPointsPerStandard=3
     */
    @PostMapping("/seed/bulk")
    public ResponseEntity<Map<String, Object>> seedBulk(
            @RequestParam(defaultValue = "100") int count,
            @RequestParam(required = false) String prefix,
            @RequestParam(defaultValue = "3") int lotoPointsPerStandard) {
        log.info("API: Seed bulk {} LotoStandards with {} points each", count, lotoPointsPerStandard);
        Map<String, Object> result = syncE2ETestService.seedBulk(prefix, count, lotoPointsPerStandard);
        return ResponseEntity.ok(result);
    }

    /**
     * Verify entity graph state for a given prefix.
     * GET /api/sync-e2e/verify/{prefix}
     */
    @GetMapping("/verify/{prefix}")
    public ResponseEntity<Map<String, Object>> verifyEntityGraph(@PathVariable String prefix) {
        Map<String, Object> result = syncE2ETestService.verifyEntityGraph(prefix);
        return ResponseEntity.ok(result);
    }

    /**
     * Cleanup entities by prefix (soft-delete).
     * DELETE /api/sync-e2e/cleanup/{prefix}
     */
    @DeleteMapping("/cleanup/{prefix}")
    public ResponseEntity<Map<String, Object>> cleanup(@PathVariable String prefix) {
        log.info("API: Cleanup entities with prefix={}", prefix);
        Map<String, Object> result = syncE2ETestService.cleanup(prefix);
        return ResponseEntity.ok(result);
    }

    /**
     * Cleanup all SYNC_E2E_* entities.
     * DELETE /api/sync-e2e/cleanup/all
     */
    @DeleteMapping("/cleanup/all")
    public ResponseEntity<Map<String, Object>> cleanupAll() {
        log.info("API: Cleanup all SYNC_E2E entities");
        Map<String, Object> result = syncE2ETestService.cleanupAll();
        return ResponseEntity.ok(result);
    }

    // ==================== FILE ENTITY GRAPH ENDPOINTS ====================

    /**
     * Seed a file entity graph: Categories → Values → FileObjects (with files on disk)
     * → Equipment → LotoPoints → LotoStandards.
     * POST /api/sync-e2e/seed/files
     */
    @PostMapping("/seed/files")
    public ResponseEntity<Map<String, Object>> seedFileEntityGraph(@RequestBody Map<String, Object> request) {
        String prefix = (String) request.getOrDefault("prefix", "SYNC_E2E_" + System.currentTimeMillis());
        int iterations = (int) request.getOrDefault("iterations", 3);
        log.info("API: Seed file entity graph with prefix={}, iterations={}", prefix, iterations);
        Map<String, Object> result = syncE2EFileTestService.seedFileEntityGraph(prefix, iterations);
        return ResponseEntity.ok(result);
    }

    /**
     * Verify file entity graph with disk existence check.
     * GET /api/sync-e2e/verify/files/{prefix}
     */
    @GetMapping("/verify/files/{prefix}")
    public ResponseEntity<Map<String, Object>> verifyFileEntityGraph(@PathVariable String prefix) {
        Map<String, Object> result = syncE2EFileTestService.verifyFileEntityGraph(prefix);
        return ResponseEntity.ok(result);
    }

    /**
     * Hard-delete file entity graph without generating FieldChanges.
     * Uses native SQL + SyncContext suppression.
     * POST /api/sync-e2e/hard-delete/{prefix}
     */
    @PostMapping("/hard-delete/{prefix}")
    public ResponseEntity<Map<String, Object>> hardDeleteFileGraph(@PathVariable String prefix) {
        log.info("API: Hard-delete file graph with prefix={}", prefix);
        Map<String, Object> result = syncE2EFileTestService.hardDeleteFileGraph(prefix);
        return ResponseEntity.ok(result);
    }

    /**
     * Manually trigger Category/Value deduplication.
     * POST /api/sync-e2e/trigger-dedup
     */
    @PostMapping("/trigger-dedup")
    public ResponseEntity<Map<String, Object>> triggerDedup() {
        log.info("API: Triggering manual deduplication");
        long start = System.currentTimeMillis();
        categoryValueMergeService.mergeIfDuplicatesExist();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "durationMs", System.currentTimeMillis() - start
        ));
    }

    /**
     * Self-heal Category/Value duplicate divergence that predates the deterministic pre-save path:
     * re-create the smaller-id survivor wherever this node wrongly kept the larger id, then run the
     * deterministic merge to converge + emit synced changes. Runs on ANY node (hub or client).
     * POST /api/sync-e2e/reconcile-divergence
     */
    @PostMapping("/reconcile-divergence")
    public ResponseEntity<Map<String, Object>> reconcileDivergence() {
        log.info("API: Triggering natural-key divergence reconcile");
        long start = System.currentTimeMillis();
        NaturalKeyDivergenceReconciler.ReconcileResult result = naturalKeyDivergenceReconciler.reconcile();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "ranOnHub", result.ranOnHub(),
                "recreated", result.recreated(),
                "wrongEntriesSeen", result.wrongEntriesSeen(),
                "remapsCleaned", result.remapsCleaned(),
                "durationMs", System.currentTimeMillis() - start
        ));
    }
}
