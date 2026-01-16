package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for sync testing operations.
 * Provides methods to generate test data, run sync tests, and collect metrics.
 */
@Service
@Slf4j
public class SyncTestService {

    private final FieldChangeRepository fieldChangeRepository;
    private final SyncConfig syncConfig;
    private final FieldSyncService fieldSyncService;
    private final CentralSyncService centralSyncService;
    private final ServiceFacade serviceFacade;
    private final ObjectMapper objectMapper;

    public SyncTestService(
            FieldChangeRepository fieldChangeRepository,
            SyncConfig syncConfig,
            FieldSyncService fieldSyncService,
            CentralSyncService centralSyncService,
            @Lazy ServiceFacade serviceFacade,
            ObjectMapper objectMapper
    ) {
        this.fieldChangeRepository = fieldChangeRepository;
        this.syncConfig = syncConfig;
        this.fieldSyncService = fieldSyncService;
        this.centralSyncService = centralSyncService;
        this.serviceFacade = serviceFacade;
        this.objectMapper = objectMapper;
    }

    // Test run history (keep last 50 runs)
    private final ConcurrentLinkedQueue<TestRun> testHistory = new ConcurrentLinkedQueue<>();
    private static final int MAX_HISTORY_SIZE = 50;

    // Metrics tracking
    private final AtomicLong totalTestChangesGenerated = new AtomicLong(0);
    private final AtomicLong totalTestChangesCleared = new AtomicLong(0);
    private final AtomicLong totalSyncTestsRun = new AtomicLong(0);

    // Test entity type markers
    public static final String TEST_ENTITY_PREFIX = "SyncTest_";
    public static final String BULK_CREATE_TYPE = TEST_ENTITY_PREFIX + "BulkCreate";
    public static final String BULK_UPDATE_TYPE = TEST_ENTITY_PREFIX + "BulkUpdate";
    public static final String BULK_DELETE_TYPE = TEST_ENTITY_PREFIX + "BulkDelete";
    public static final String MIXED_TYPE = TEST_ENTITY_PREFIX + "Mixed";
    public static final String STRESS_TYPE = TEST_ENTITY_PREFIX + "Stress";

    /**
     * Generate bulk test data.
     */
    @Transactional
    public TestResult generateBulkTestData(int count, String testType) {
        long startTime = System.currentTimeMillis();
        String entityType = resolveEntityType(testType);

        log.info("Generating {} test changes of type: {}", count, entityType);

        List<FieldChange> changes = new ArrayList<>(count);
        Instant baseTime = Instant.now();

        for (int i = 0; i < count; i++) {
            FieldChange change = new FieldChange();
            change.setEntityType(entityType);
            change.setEntityId((long) (i % 1000)); // 1000 different entities
            change.setFieldName("testField" + (i % 20)); // 20 different fields
            change.setOldValue("\"oldValue_" + i + "\"");
            change.setNewValue("\"newValue_" + i + "_" + UUID.randomUUID().toString().substring(0, 8) + "\"");
            change.setTimestamp(baseTime.minusSeconds(count - i)); // Spread timestamps
            change.setOriginMachineId(syncConfig.getMachineId());
            change.setOriginMachineName(syncConfig.getMachineName());
            change.setChangeType(resolveChangeType(testType));
            change.setSyncedToMachines("");
            changes.add(change);
        }

        fieldChangeRepository.saveAll(changes);

        long duration = System.currentTimeMillis() - startTime;
        double rate = count / (duration / 1000.0);
        totalTestChangesGenerated.addAndGet(count);

        TestResult result = new TestResult(
            true,
            String.format("Generated %d test changes of type %s", count, testType),
            count,
            duration,
            rate,
            getTestDataCount(),
            getPendingChangesCount()
        );

        addToHistory(new TestRun("GENERATE", testType, count, duration, true, Instant.now()));
        log.info("Generated {} changes in {}ms ({} changes/sec)", count, duration, String.format("%.2f", rate));

        return result;
    }

    /**
     * Generate mixed changes (creates, updates, deletes).
     */
    @Transactional
    public TestResult generateMixedChanges(int creates, int updates, int deletes) {
        long startTime = System.currentTimeMillis();
        int totalCount = creates + updates + deletes;

        log.info("Generating mixed changes: {} creates, {} updates, {} deletes", creates, updates, deletes);

        List<FieldChange> changes = new ArrayList<>(totalCount);
        Instant baseTime = Instant.now();
        int index = 0;

        // Generate creates
        for (int i = 0; i < creates; i++) {
            changes.add(createTestChange(MIXED_TYPE, index++, baseTime, FieldChange.ChangeType.CREATE));
        }

        // Generate updates
        for (int i = 0; i < updates; i++) {
            changes.add(createTestChange(MIXED_TYPE, index++, baseTime, FieldChange.ChangeType.UPDATE));
        }

        // Generate deletes
        for (int i = 0; i < deletes; i++) {
            changes.add(createTestChange(MIXED_TYPE, index++, baseTime, FieldChange.ChangeType.DELETE));
        }

        fieldChangeRepository.saveAll(changes);

        long duration = System.currentTimeMillis() - startTime;
        double rate = totalCount / (duration / 1000.0);
        totalTestChangesGenerated.addAndGet(totalCount);

        TestResult result = new TestResult(
            true,
            String.format("Generated %d mixed changes (%d creates, %d updates, %d deletes)",
                totalCount, creates, updates, deletes),
            totalCount,
            duration,
            rate,
            getTestDataCount(),
            getPendingChangesCount()
        );

        addToHistory(new TestRun("GENERATE_MIXED", "MIXED", totalCount, duration, true, Instant.now()));
        return result;
    }

    /**
     * Trigger sync and measure performance.
     */
    public TestResult triggerSyncAndMeasure() {
        long startTime = System.currentTimeMillis();
        long pendingBefore = getPendingChangesCount();

        log.info("Triggering sync test with {} pending changes", pendingBefore);

        try {
            // Trigger sync based on configuration
            if (syncConfig.isServerSyncEnabled()) {
                centralSyncService.syncWithServer();
            } else {
                fieldSyncService.syncWithAllPeers();
            }

            long duration = System.currentTimeMillis() - startTime;
            long pendingAfter = getPendingChangesCount();
            long synced = pendingBefore - pendingAfter;
            double rate = synced > 0 ? synced / (duration / 1000.0) : 0;

            totalSyncTestsRun.incrementAndGet();

            TestResult result = new TestResult(
                true,
                String.format("Sync completed: %d changes synced in %dms", synced, duration),
                (int) synced,
                duration,
                rate,
                getTestDataCount(),
                pendingAfter
            );

            addToHistory(new TestRun("SYNC", "SYNC", (int) synced, duration, true, Instant.now()));
            log.info("Sync completed: {} changes synced in {}ms", synced, duration);

            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Sync test failed: {}", e.getMessage(), e);

            addToHistory(new TestRun("SYNC", "SYNC", 0, duration, false, Instant.now()));

            return new TestResult(
                false,
                "Sync failed: " + e.getMessage(),
                0,
                duration,
                0,
                getTestDataCount(),
                getPendingChangesCount()
            );
        }
    }

    /**
     * Run full test cycle: generate -> sync -> verify.
     */
    @Transactional
    public TestResult runFullCycle(int count, String testType) {
        long startTime = System.currentTimeMillis();

        log.info("Running full test cycle with {} changes of type {}", count, testType);

        // Step 1: Generate test data
        TestResult generateResult = generateBulkTestData(count, testType);
        if (!generateResult.success) {
            return generateResult;
        }

        // Step 2: Trigger sync
        TestResult syncResult = triggerSyncAndMeasure();

        long totalDuration = System.currentTimeMillis() - startTime;

        TestResult result = new TestResult(
            syncResult.success,
            String.format("Full cycle completed: generated %d, synced %d in %dms total",
                generateResult.count, syncResult.count, totalDuration),
            count,
            totalDuration,
            count / (totalDuration / 1000.0),
            getTestDataCount(),
            getPendingChangesCount()
        );

        addToHistory(new TestRun("FULL_CYCLE", testType, count, totalDuration, syncResult.success, Instant.now()));
        return result;
    }

    /**
     * Clear all test data.
     */
    @Transactional
    public TestResult clearAllTestData() {
        long startTime = System.currentTimeMillis();

        log.info("Clearing all test data...");

        List<FieldChange> testChanges = fieldChangeRepository.findAll().stream()
            .filter(c -> c.getEntityType() != null && c.getEntityType().startsWith(TEST_ENTITY_PREFIX))
            .toList();

        int count = testChanges.size();
        fieldChangeRepository.deleteAll(testChanges);

        long duration = System.currentTimeMillis() - startTime;
        totalTestChangesCleared.addAndGet(count);

        TestResult result = new TestResult(
            true,
            String.format("Cleared %d test changes", count),
            count,
            duration,
            count / (duration / 1000.0),
            getTestDataCount(),
            getPendingChangesCount()
        );

        addToHistory(new TestRun("CLEAR", "ALL", count, duration, true, Instant.now()));
        log.info("Cleared {} test changes in {}ms", count, duration);

        return result;
    }

    /**
     * Clear test data by specific type.
     */
    @Transactional
    public TestResult clearTestDataByType(String testType) {
        long startTime = System.currentTimeMillis();
        String entityType = resolveEntityType(testType);

        log.info("Clearing test data of type: {}", entityType);

        List<FieldChange> testChanges = fieldChangeRepository.findAll().stream()
            .filter(c -> entityType.equals(c.getEntityType()))
            .toList();

        int count = testChanges.size();
        fieldChangeRepository.deleteAll(testChanges);

        long duration = System.currentTimeMillis() - startTime;
        totalTestChangesCleared.addAndGet(count);

        TestResult result = new TestResult(
            true,
            String.format("Cleared %d test changes of type %s", count, testType),
            count,
            duration,
            count / (duration / 1000.0),
            getTestDataCount(),
            getPendingChangesCount()
        );

        addToHistory(new TestRun("CLEAR", testType, count, duration, true, Instant.now()));
        return result;
    }

    /**
     * Get current test metrics.
     */
    public TestMetrics getTestMetrics() {
        return new TestMetrics(
            getTestDataCount(),
            getPendingChangesCount(),
            fieldChangeRepository.count(),
            totalTestChangesGenerated.get(),
            totalTestChangesCleared.get(),
            totalSyncTestsRun.get(),
            syncConfig.isServerSyncEnabled(),
            syncConfig.getMachineId(),
            syncConfig.getMachineName()
        );
    }

    /**
     * Get test run history.
     */
    public List<TestRun> getTestHistory() {
        return new ArrayList<>(testHistory);
    }

    /**
     * Get current sync status.
     */
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("testDataCount", getTestDataCount());
        status.put("pendingChanges", getPendingChangesCount());
        status.put("totalChanges", fieldChangeRepository.count());
        status.put("serverSyncEnabled", syncConfig.isServerSyncEnabled());
        status.put("machineId", syncConfig.getMachineId());
        status.put("machineName", syncConfig.getMachineName());

        // Add sync service metrics
        if (syncConfig.isServerSyncEnabled()) {
            status.put("centralSyncMetrics", centralSyncService.getMetrics());
        }

        return status;
    }

    // ==================== EXISTING ENTITY TESTS ====================

    /**
     * Test sync with existing Equipment entities.
     * Modifies a test field on all Equipment, syncs, then reverts.
     */
    @Transactional
    public TestResult testExistingEquipment(boolean revertAfter) {
        return testExistingEntities("Equipment", "specificLocation", revertAfter);
    }

    /**
     * Test sync with existing LotoPoint entities.
     * Modifies a test field on all LotoPoints, syncs, then optionally reverts.
     */
    @Transactional
    public TestResult testExistingLotoPoints(boolean revertAfter) {
        return testExistingEntities("LotoPoint", "extraInfo", revertAfter);
    }

    /**
     * Test sync with existing FileObject entities.
     * Modifies a test field on all FileObjects, syncs, then optionally reverts.
     */
    @Transactional
    public TestResult testExistingFileObjects(boolean revertAfter) {
        return testExistingEntities("FileObject", "relatedSystems", revertAfter);
    }

    /**
     * Run a comprehensive test on all large tables.
     * Tests Equipment, LotoPoint, and FileObject in sequence.
     */
    public TestResult testAllExistingEntities(boolean revertAfter) {
        long startTime = System.currentTimeMillis();

        log.info("Running comprehensive existing entity test...");

        List<String> messages = new ArrayList<>();
        int totalChanges = 0;
        boolean allSuccess = true;

        // Test Equipment
        TestResult equipmentResult = testExistingEquipment(revertAfter);
        messages.add("Equipment: " + equipmentResult.message());
        totalChanges += equipmentResult.count();
        allSuccess = allSuccess && equipmentResult.success();

        // Test LotoPoints
        TestResult lotoResult = testExistingLotoPoints(revertAfter);
        messages.add("LotoPoint: " + lotoResult.message());
        totalChanges += lotoResult.count();
        allSuccess = allSuccess && lotoResult.success();

        // Test FileObjects
        TestResult fileResult = testExistingFileObjects(revertAfter);
        messages.add("FileObject: " + fileResult.message());
        totalChanges += fileResult.count();
        allSuccess = allSuccess && fileResult.success();

        long duration = System.currentTimeMillis() - startTime;

        TestResult result = new TestResult(
            allSuccess,
            String.join(" | ", messages),
            totalChanges,
            duration,
            totalChanges / (duration / 1000.0),
            getTestDataCount(),
            getPendingChangesCount()
        );

        addToHistory(new TestRun("TEST_ALL_ENTITIES", "ALL", totalChanges, duration, allSuccess, Instant.now()));
        return result;
    }

    /**
     * Generic method to test sync with existing entities.
     * Creates field change records for all entities of the given type,
     * triggers sync, and optionally reverts the changes.
     */
    @SuppressWarnings("unchecked")
    @Transactional
    public TestResult testExistingEntities(String entityType, String fieldName, boolean revertAfter) {
        long startTime = System.currentTimeMillis();

        log.info("Testing sync for existing {} entities (field: {}, revert: {})", entityType, fieldName, revertAfter);

        CrudService<BaseAuditEntity, ?, ?, ?> service = serviceFacade.getService(entityType);
        if (service == null) {
            return new TestResult(false, "Unknown entity type: " + entityType, 0, 0, 0,
                getTestDataCount(), getPendingChangesCount());
        }

        List<BaseAuditEntity> entities = service.getAll();
        if (entities.isEmpty()) {
            return new TestResult(true, "No " + entityType + " entities found to test", 0,
                System.currentTimeMillis() - startTime, 0, getTestDataCount(), getPendingChangesCount());
        }

        log.info("Found {} {} entities to test", entities.size(), entityType);

        List<FieldChange> changes = new ArrayList<>();
        Map<Long, String> originalValues = new HashMap<>();
        Instant timestamp = Instant.now();
        String testMarker = "_SYNC_TEST_" + timestamp.toEpochMilli();

        // Create changes for each entity
        for (BaseAuditEntity entity : entities) {
            String oldValue = getFieldValue(entity, fieldName);
            String newValue = (oldValue == null ? "" : oldValue) + testMarker;

            originalValues.put(entity.getId(), oldValue);

            FieldChange change = new FieldChange();
            change.setEntityType(entityType);
            change.setEntityId(entity.getId());
            change.setFieldName(fieldName);
            change.setOldValue(serializeValue(oldValue));
            change.setNewValue(serializeValue(newValue));
            change.setTimestamp(timestamp);
            change.setOriginMachineId(syncConfig.getMachineId());
            change.setOriginMachineName(syncConfig.getMachineName());
            change.setChangeType(FieldChange.ChangeType.UPDATE);
            change.setSyncedToMachines("");
            changes.add(change);

            // Actually update the entity field for realistic test
            setFieldValue(entity, fieldName, newValue);
        }

        // Save all changes
        fieldChangeRepository.saveAll(changes);
        entities.forEach(service::save);

        int changeCount = changes.size();
        log.info("Created {} field changes for {} entities", changeCount, entityType);

        // Trigger sync
        TestResult syncResult = triggerSyncAndMeasure();

        // Revert if requested
        if (revertAfter) {
            log.info("Reverting {} changes...", changeCount);

            List<FieldChange> revertChanges = new ArrayList<>();
            Instant revertTimestamp = Instant.now();

            for (BaseAuditEntity entity : entities) {
                String currentValue = getFieldValue(entity, fieldName);
                String originalValue = originalValues.get(entity.getId());

                FieldChange revertChange = new FieldChange();
                revertChange.setEntityType(entityType);
                revertChange.setEntityId(entity.getId());
                revertChange.setFieldName(fieldName);
                revertChange.setOldValue(serializeValue(currentValue));
                revertChange.setNewValue(serializeValue(originalValue));
                revertChange.setTimestamp(revertTimestamp);
                revertChange.setOriginMachineId(syncConfig.getMachineId());
                revertChange.setOriginMachineName(syncConfig.getMachineName());
                revertChange.setChangeType(FieldChange.ChangeType.UPDATE);
                revertChange.setSyncedToMachines("");
                revertChanges.add(revertChange);

                setFieldValue(entity, fieldName, originalValue);
            }

            fieldChangeRepository.saveAll(revertChanges);
            entities.forEach(service::save);

            // Sync the revert
            triggerSyncAndMeasure();
            changeCount *= 2; // Count both directions
        }

        long duration = System.currentTimeMillis() - startTime;
        double rate = changeCount / (duration / 1000.0);

        TestResult result = new TestResult(
            syncResult.success(),
            String.format("Tested %d %s entities (%d changes%s) in %dms",
                entities.size(), entityType, changeCount,
                revertAfter ? ", reverted" : "",
                duration),
            changeCount,
            duration,
            rate,
            getTestDataCount(),
            getPendingChangesCount()
        );

        addToHistory(new TestRun("TEST_" + entityType.toUpperCase(), entityType, changeCount, duration,
            syncResult.success(), Instant.now()));

        return result;
    }

    /**
     * Get entity counts for display.
     */
    public Map<String, Long> getExistingEntityCounts() {
        Map<String, Long> counts = new HashMap<>();

        try {
            CrudService<?, ?, ?, ?> equipmentService = serviceFacade.getService("Equipment");
            counts.put("Equipment", equipmentService != null ? (long) equipmentService.getAll().size() : 0L);
        } catch (Exception e) {
            counts.put("Equipment", 0L);
        }

        try {
            CrudService<?, ?, ?, ?> lotoPointService = serviceFacade.getService("LotoPoint");
            counts.put("LotoPoint", lotoPointService != null ? (long) lotoPointService.getAll().size() : 0L);
        } catch (Exception e) {
            counts.put("LotoPoint", 0L);
        }

        try {
            CrudService<?, ?, ?, ?> fileService = serviceFacade.getService("FileObject");
            counts.put("FileObject", fileService != null ? (long) fileService.getAll().size() : 0L);
        } catch (Exception e) {
            counts.put("FileObject", 0L);
        }

        return counts;
    }

    // Helper methods for reflection-based field access

    private String getFieldValue(Object entity, String fieldName) {
        try {
            java.lang.reflect.Field field = findField(entity.getClass(), fieldName);
            if (field != null) {
                field.setAccessible(true);
                Object value = field.get(entity);
                return value != null ? value.toString() : null;
            }
        } catch (Exception e) {
            log.warn("Could not get field {} from {}: {}", fieldName, entity.getClass().getSimpleName(), e.getMessage());
        }
        return null;
    }

    private void setFieldValue(Object entity, String fieldName, String value) {
        try {
            java.lang.reflect.Field field = findField(entity.getClass(), fieldName);
            if (field != null) {
                field.setAccessible(true);
                field.set(entity, value);
            }
        } catch (Exception e) {
            log.warn("Could not set field {} on {}: {}", fieldName, entity.getClass().getSimpleName(), e.getMessage());
        }
    }

    private java.lang.reflect.Field findField(Class<?> clazz, String fieldName) {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        return null;
    }

    private String serializeValue(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "\"" + value.toString() + "\"";
        }
    }

    // Helper methods

    private FieldChange createTestChange(String entityType, int index, Instant baseTime,
                                         FieldChange.ChangeType changeType) {
        FieldChange change = new FieldChange();
        change.setEntityType(entityType);
        change.setEntityId((long) (index % 1000));
        change.setFieldName("testField" + (index % 20));
        change.setOldValue(changeType == FieldChange.ChangeType.CREATE ? null : "\"oldValue_" + index + "\"");
        change.setNewValue(changeType == FieldChange.ChangeType.DELETE ? null :
            "\"newValue_" + index + "_" + UUID.randomUUID().toString().substring(0, 8) + "\"");
        change.setTimestamp(baseTime.minusMillis(index));
        change.setOriginMachineId(syncConfig.getMachineId());
        change.setOriginMachineName(syncConfig.getMachineName());
        change.setChangeType(changeType);
        change.setSyncedToMachines("");
        return change;
    }

    private String resolveEntityType(String testType) {
        if (testType == null) return BULK_CREATE_TYPE;
        return switch (testType.toUpperCase()) {
            case "BULK_CREATE", "CREATE" -> BULK_CREATE_TYPE;
            case "BULK_UPDATE", "UPDATE" -> BULK_UPDATE_TYPE;
            case "BULK_DELETE", "DELETE" -> BULK_DELETE_TYPE;
            case "MIXED" -> MIXED_TYPE;
            case "STRESS" -> STRESS_TYPE;
            default -> TEST_ENTITY_PREFIX + testType;
        };
    }

    private FieldChange.ChangeType resolveChangeType(String testType) {
        if (testType == null) return FieldChange.ChangeType.CREATE;
        return switch (testType.toUpperCase()) {
            case "BULK_UPDATE", "UPDATE" -> FieldChange.ChangeType.UPDATE;
            case "BULK_DELETE", "DELETE" -> FieldChange.ChangeType.DELETE;
            default -> FieldChange.ChangeType.CREATE;
        };
    }

    private long getTestDataCount() {
        return fieldChangeRepository.findAll().stream()
            .filter(c -> c.getEntityType() != null && c.getEntityType().startsWith(TEST_ENTITY_PREFIX))
            .count();
    }

    private long getPendingChangesCount() {
        String targetMachine = syncConfig.isServerSyncEnabled() ? "SERVER" : "ALL_PEERS";
        return fieldChangeRepository.countPendingChangesFor(targetMachine);
    }

    private void addToHistory(TestRun run) {
        testHistory.add(run);
        while (testHistory.size() > MAX_HISTORY_SIZE) {
            testHistory.poll();
        }
    }

    // DTOs

    public record TestResult(
        boolean success,
        String message,
        int count,
        long durationMs,
        double changesPerSecond,
        long testDataCount,
        long pendingChanges
    ) {}

    public record TestMetrics(
        long testDataCount,
        long pendingChanges,
        long totalChanges,
        long totalGenerated,
        long totalCleared,
        long totalSyncTests,
        boolean serverSyncEnabled,
        String machineId,
        String machineName
    ) {}

    public record TestRun(
        String operation,
        String testType,
        int count,
        long durationMs,
        boolean success,
        Instant timestamp
    ) {}
}
