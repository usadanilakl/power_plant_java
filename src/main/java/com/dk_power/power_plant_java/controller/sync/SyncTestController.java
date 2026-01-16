package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.sevice.sync.SyncTestService;
import com.dk_power.power_plant_java.sevice.sync.SyncTestService.TestMetrics;
import com.dk_power.power_plant_java.sevice.sync.SyncTestService.TestResult;
import com.dk_power.power_plant_java.sevice.sync.SyncTestService.TestRun;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for sync testing operations.
 * Provides endpoints to generate test data, run sync tests, and view metrics.
 */
@RestController
@RequestMapping("/api/sync-test")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SyncTestController {

    private final SyncTestService syncTestService;

    // ==================== TEST DATA GENERATION ====================

    /**
     * Generate bulk test data.
     * POST /api/sync-test/generate?count=1000&testType=BULK_CREATE
     */
    @PostMapping("/generate")
    public ResponseEntity<TestResult> generateTestData(
            @RequestParam(defaultValue = "100") int count,
            @RequestParam(defaultValue = "BULK_CREATE") String testType) {
        log.info("API: Generate {} test changes of type {}", count, testType);
        TestResult result = syncTestService.generateBulkTestData(count, testType);
        return ResponseEntity.ok(result);
    }

    /**
     * Generate mixed changes (creates, updates, deletes).
     * POST /api/sync-test/generate/mixed?creates=100&updates=50&deletes=25
     */
    @PostMapping("/generate/mixed")
    public ResponseEntity<TestResult> generateMixedChanges(
            @RequestParam(defaultValue = "100") int creates,
            @RequestParam(defaultValue = "50") int updates,
            @RequestParam(defaultValue = "25") int deletes) {
        log.info("API: Generate mixed changes - {} creates, {} updates, {} deletes", creates, updates, deletes);
        TestResult result = syncTestService.generateMixedChanges(creates, updates, deletes);
        return ResponseEntity.ok(result);
    }

    // ==================== SYNC OPERATIONS ====================

    /**
     * Trigger sync and measure performance.
     * POST /api/sync-test/sync
     */
    @PostMapping("/sync")
    public ResponseEntity<TestResult> triggerSync() {
        log.info("API: Trigger sync test");
        TestResult result = syncTestService.triggerSyncAndMeasure();
        return ResponseEntity.ok(result);
    }

    /**
     * Run full test cycle: generate -> sync -> verify.
     * POST /api/sync-test/full-cycle?count=1000&testType=BULK_CREATE
     */
    @PostMapping("/full-cycle")
    public ResponseEntity<TestResult> runFullCycle(
            @RequestParam(defaultValue = "100") int count,
            @RequestParam(defaultValue = "BULK_CREATE") String testType) {
        log.info("API: Run full cycle with {} changes of type {}", count, testType);
        TestResult result = syncTestService.runFullCycle(count, testType);
        return ResponseEntity.ok(result);
    }

    // ==================== EXISTING ENTITY TESTS ====================

    /**
     * Test sync with existing Equipment entities.
     * POST /api/sync-test/test/equipment?revert=true
     */
    @PostMapping("/test/equipment")
    public ResponseEntity<TestResult> testEquipment(
            @RequestParam(defaultValue = "true") boolean revert) {
        log.info("API: Test Equipment sync (revert={})", revert);
        TestResult result = syncTestService.testExistingEquipment(revert);
        return ResponseEntity.ok(result);
    }

    /**
     * Test sync with existing LotoPoint entities.
     * POST /api/sync-test/test/loto-points?revert=true
     */
    @PostMapping("/test/loto-points")
    public ResponseEntity<TestResult> testLotoPoints(
            @RequestParam(defaultValue = "true") boolean revert) {
        log.info("API: Test LotoPoint sync (revert={})", revert);
        TestResult result = syncTestService.testExistingLotoPoints(revert);
        return ResponseEntity.ok(result);
    }

    /**
     * Test sync with existing FileObject entities.
     * POST /api/sync-test/test/file-objects?revert=true
     */
    @PostMapping("/test/file-objects")
    public ResponseEntity<TestResult> testFileObjects(
            @RequestParam(defaultValue = "true") boolean revert) {
        log.info("API: Test FileObject sync (revert={})", revert);
        TestResult result = syncTestService.testExistingFileObjects(revert);
        return ResponseEntity.ok(result);
    }

    /**
     * Test all existing entity types (Equipment, LotoPoint, FileObject).
     * POST /api/sync-test/test/all-entities?revert=true
     */
    @PostMapping("/test/all-entities")
    public ResponseEntity<TestResult> testAllEntities(
            @RequestParam(defaultValue = "true") boolean revert) {
        log.info("API: Test all entities (revert={})", revert);
        TestResult result = syncTestService.testAllExistingEntities(revert);
        return ResponseEntity.ok(result);
    }

    /**
     * Test any entity type by name.
     * POST /api/sync-test/test/entity?type=Equipment&field=specificLocation&revert=true
     */
    @PostMapping("/test/entity")
    public ResponseEntity<TestResult> testEntity(
            @RequestParam String type,
            @RequestParam String field,
            @RequestParam(defaultValue = "true") boolean revert) {
        log.info("API: Test {} entity, field={}, revert={}", type, field, revert);
        TestResult result = syncTestService.testExistingEntities(type, field, revert);
        return ResponseEntity.ok(result);
    }

    // ==================== CLEANUP ====================

    /**
     * Clear all test data.
     * DELETE /api/sync-test/clear
     */
    @DeleteMapping("/clear")
    public ResponseEntity<TestResult> clearAllTestData() {
        log.info("API: Clear all test data");
        TestResult result = syncTestService.clearAllTestData();
        return ResponseEntity.ok(result);
    }

    /**
     * Clear test data by specific type.
     * DELETE /api/sync-test/clear/{testType}
     */
    @DeleteMapping("/clear/{testType}")
    public ResponseEntity<TestResult> clearTestDataByType(@PathVariable String testType) {
        log.info("API: Clear test data of type {}", testType);
        TestResult result = syncTestService.clearTestDataByType(testType);
        return ResponseEntity.ok(result);
    }

    // ==================== METRICS & STATUS ====================

    /**
     * Get current test metrics.
     * GET /api/sync-test/metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<TestMetrics> getMetrics() {
        TestMetrics metrics = syncTestService.getTestMetrics();
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get test run history.
     * GET /api/sync-test/history
     */
    @GetMapping("/history")
    public ResponseEntity<List<TestRun>> getHistory() {
        List<TestRun> history = syncTestService.getTestHistory();
        return ResponseEntity.ok(history);
    }

    /**
     * Get current sync status.
     * GET /api/sync-test/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = syncTestService.getStatus();
        return ResponseEntity.ok(status);
    }

    /**
     * Get existing entity counts.
     * GET /api/sync-test/entity-counts
     */
    @GetMapping("/entity-counts")
    public ResponseEntity<Map<String, Long>> getEntityCounts() {
        Map<String, Long> counts = syncTestService.getExistingEntityCounts();
        return ResponseEntity.ok(counts);
    }

    /**
     * Get available test types.
     * GET /api/sync-test/test-types
     */
    @GetMapping("/test-types")
    public ResponseEntity<Map<String, Object>> getTestTypes() {
        Map<String, Object> types = new HashMap<>();

        types.put("syntheticTests", List.of(
            Map.of("id", "BULK_CREATE", "name", "Bulk Create", "description", "Generate many CREATE changes"),
            Map.of("id", "BULK_UPDATE", "name", "Bulk Update", "description", "Generate many UPDATE changes"),
            Map.of("id", "BULK_DELETE", "name", "Bulk Delete", "description", "Generate many DELETE changes"),
            Map.of("id", "MIXED", "name", "Mixed Changes", "description", "Mix of creates, updates, and deletes"),
            Map.of("id", "STRESS", "name", "Stress Test", "description", "High-frequency rapid changes")
        ));

        types.put("existingEntityTests", List.of(
            Map.of("id", "equipment", "name", "Equipment", "description", "Test sync with Equipment table", "endpoint", "/test/equipment"),
            Map.of("id", "loto-points", "name", "LOTO Points", "description", "Test sync with LotoPoint table", "endpoint", "/test/loto-points"),
            Map.of("id", "file-objects", "name", "File Objects", "description", "Test sync with FileObject table", "endpoint", "/test/file-objects"),
            Map.of("id", "all-entities", "name", "All Entities", "description", "Test all entity types", "endpoint", "/test/all-entities")
        ));

        return ResponseEntity.ok(types);
    }
}
