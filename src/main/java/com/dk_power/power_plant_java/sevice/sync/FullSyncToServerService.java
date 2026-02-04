package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.*;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.*;
import com.dk_power.power_plant_java.entities.permits.*;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.equipment.*;
import com.dk_power.power_plant_java.repository.esp.EspDeviceRepo;
import com.dk_power.power_plant_java.repository.esp.LedStripRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.*;
import com.dk_power.power_plant_java.repository.permits.*;
import com.dk_power.power_plant_java.repository.base_repositories.CommentRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for performing a full sync of all entities from client to server.
 *
 * This service is designed for one-time (or rare) use to populate the sync server
 * with all existing data from a client database. It:
 *
 * 1. Iterates through all syncable entity types in dependency order
 * 2. Creates synthetic "CREATE" FieldChanges for each entity
 * 3. Sends them in small batches to the server's existing /api/sync/exchange endpoint
 * 4. Queues all files for upload via existing file sync mechanism
 *
 * Safety considerations:
 * - Uses small batch sizes to avoid memory issues
 * - Transactional per batch for recoverability
 * - Progress tracking and resumability
 * - Safe to run multiple times (server handles duplicates via LWW)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FullSyncToServerService {

    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final FileObjectSyncHandler fileObjectSyncHandler;

    // Repositories for all syncable entities
    private final CategoryRepo categoryRepo;
    private final ValueRepo valueRepo;
    private final FileRepo fileRepo;
    private final EquipmentRepo equipmentRepo;
    private final LotoPointRepo lotoPointRepo;
    private final LotoRepo lotoRepo;
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoSnapshotRepo lotoSnapshotRepo;
    private final LotoBoxRepo lotoBoxRepo;
    private final LockRepo lockRepo;
    private final ZeroEnergyRepo zeroEnergyRepo;
    private final HeatTraceRepo heatTraceRepo;
    private final HighlightRepo highlightRepo;
    private final ElectricalPanelRepo electricalPanelRepo;
    private final EqBreakerRepo eqBreakerRepo;
    private final HtPanelRepo htPanelRepo;
    private final HtBreakerRepo htBreakerRepo;
    private final UserRepo userRepo;
    private final EspDeviceRepo espDeviceRepo;
    private final LedStripRepo ledStripRepo;
    private final SafeWorkRepo safeWorkRepo;
    private final HotWorkRepo hotWorkRepo;
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final WorkRequestRepo workRequestRepo;
    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final CommentRepo commentRepo;

    // Sync state
    private final AtomicBoolean syncInProgress = new AtomicBoolean(false);
    private volatile FullSyncStatus currentStatus = new FullSyncStatus();

    // Configuration
    private static final int BATCH_SIZE = 100; // Small batches for safety
    private static final int PAGE_SIZE = 500;  // For reading from DB

    // Field cache for performance
    private static final ConcurrentHashMap<Class<?>, List<CachedFieldInfo>> FIELD_CACHE = new ConcurrentHashMap<>();

    // Fields to exclude from sync
    private static final Set<String> EXCLUDED_FIELDS = Set.of(
        "id", "dateCreated", "dateModified", "objectType", "serialVersionUID",
        "hibernateLazyInitializer", "handler"
    );

    /**
     * Entity types to sync, in dependency order.
     * Categories and Values first (base entities), then other entities that reference them.
     */
    private static final List<EntitySyncConfig> ENTITY_SYNC_ORDER = List.of(
        new EntitySyncConfig("Category", Category.class),
        new EntitySyncConfig("Value", Value.class),
        new EntitySyncConfig("Comment", Comment.class),
        new EntitySyncConfig("User", User.class),
        new EntitySyncConfig("FileObject", FileObject.class),
        new EntitySyncConfig("Equipment", Equipment.class),
        new EntitySyncConfig("LotoPoint", LotoPoint.class),
        new EntitySyncConfig("Loto", Loto.class),
        new EntitySyncConfig("LotoStandard", LotoStandard.class),
        new EntitySyncConfig("LotoSnapshot", LotoSnapshot.class),
        new EntitySyncConfig("LotoBox", LotoBox.class),
        new EntitySyncConfig("Lock", Lock.class),
        new EntitySyncConfig("ZeroEnergy", ZeroEnergy.class),
        new EntitySyncConfig("HeatTrace", HeatTrace.class),
        new EntitySyncConfig("Highlight", Highlight.class),
        new EntitySyncConfig("ElectricalPanel", ElectricalPanel.class),
        new EntitySyncConfig("EqBreaker", EqBreaker.class),
        new EntitySyncConfig("HtPanel", HtPanel.class),
        new EntitySyncConfig("HtBreaker", HtBreaker.class),
        new EntitySyncConfig("EspDevice", EspDevice.class),
        new EntitySyncConfig("LedStrip", LedStrip.class),
        new EntitySyncConfig("SafeWork", SafeWork.class),
        new EntitySyncConfig("HotWork", HotWork.class),
        new EntitySyncConfig("ConfinedSpace", ConfinedSpace.class),
        new EntitySyncConfig("WorkRequest", WorkRequest.class),
        new EntitySyncConfig("DailyPermitPackage", DailyPermitPackage.class)
    );

    /**
     * Start a full sync to the server asynchronously.
     * Returns immediately with the sync ID.
     */
    @Async
    public void startFullSync() {
        if (!syncInProgress.compareAndSet(false, true)) {
            log.warn("Full sync already in progress");
            return;
        }

        currentStatus = new FullSyncStatus();
        currentStatus.setStartTime(Instant.now());
        currentStatus.setPhase("Initializing");

        try {
            performFullSync();
        } catch (Exception e) {
            log.error("Full sync failed: {}", e.getMessage(), e);
            currentStatus.setPhase("Failed: " + e.getMessage());
            currentStatus.setSuccess(false);
        } finally {
            currentStatus.setEndTime(Instant.now());
            syncInProgress.set(false);
        }
    }

    /**
     * Main sync logic - iterates through all entity types and sends to server.
     */
    private void performFullSync() {
        log.info("Starting full sync to server: {}", syncConfig.getSyncServerUrl());

        // Phase 1: Count all entities
        currentStatus.setPhase("Counting entities");
        Map<String, Long> entityCounts = countAllEntities();
        long totalEntities = entityCounts.values().stream().mapToLong(Long::longValue).sum();
        currentStatus.setTotalEntities(totalEntities);
        log.info("Total entities to sync: {}", totalEntities);

        // Phase 2: Sync each entity type in order
        // ManyToMany changes are deferred to a final pass to ensure all referenced
        // entities exist on the server before join table entries are attempted.
        // Without this, Equipment.lotoPoints changes arrive before LotoPoint entities,
        // causing the server to silently drop the join table entries.
        AtomicLong totalSent = new AtomicLong(0);
        AtomicLong totalFailed = new AtomicLong(0);
        List<FieldChange> deferredManyToManyChanges = new ArrayList<>();

        for (int i = 0; i < ENTITY_SYNC_ORDER.size(); i++) {
            EntitySyncConfig config = ENTITY_SYNC_ORDER.get(i);
            currentStatus.setPhase("Syncing " + config.entityType);
            currentStatus.setCurrentEntityType(config.entityType);
            currentStatus.setLastCompletedPage(-1); // Reset page tracking for new entity type

            try {
                SyncResult result = syncEntityType(config, deferredManyToManyChanges);
                totalSent.addAndGet(result.sentCount);
                totalFailed.addAndGet(result.failedCount);
                currentStatus.setEntitiesSent(totalSent.get());
                currentStatus.setEntitiesFailed(totalFailed.get());
                currentStatus.setLastCompletedEntityIndex(i); // Track completed entity type

                log.info("Synced {}: {} sent, {} failed",
                    config.entityType, result.sentCount, result.failedCount);
            } catch (Exception e) {
                log.error("Error syncing {}: {}", config.entityType, e.getMessage());
                currentStatus.addError(config.entityType + ": " + e.getMessage());
            }
        }

        // Phase 2b: Send deferred ManyToMany changes now that all entities exist on server
        if (!deferredManyToManyChanges.isEmpty()) {
            currentStatus.setPhase("Syncing ManyToMany relationships");
            log.info("Sending {} deferred ManyToMany changes", deferredManyToManyChanges.size());

            for (int i = 0; i < deferredManyToManyChanges.size(); i += BATCH_SIZE) {
                List<FieldChange> batch = new ArrayList<>(
                    deferredManyToManyChanges.subList(i, Math.min(i + BATCH_SIZE, deferredManyToManyChanges.size())));
                BatchSendResult result = sendBatch(batch);
                totalSent.addAndGet(result.sent);
                totalFailed.addAndGet(result.failed);
                currentStatus.setEntitiesSent(totalSent.get());
                currentStatus.setEntitiesFailed(totalFailed.get());

                if (result.failed > 0 && result.errorMessage != null) {
                    currentStatus.recordFailedBatch("ManyToMany", 0, i / BATCH_SIZE, result.errorMessage);
                }
            }

            log.info("ManyToMany sync complete: {} changes sent", deferredManyToManyChanges.size());
        }

        // Phase 3: Queue files for upload
        currentStatus.setPhase("Queuing files for upload");
        int filesQueued = queueFilesForUpload();
        currentStatus.setFilesQueued(filesQueued);

        // Complete
        currentStatus.setPhase("Complete");
        currentStatus.setSuccess(true);
        log.info("Full sync complete: {} entities sent, {} failed, {} files queued",
            totalSent.get(), totalFailed.get(), filesQueued);
    }

    /**
     * Count entities for each type.
     */
    private Map<String, Long> countAllEntities() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("Category", categoryRepo.count());
        counts.put("Value", valueRepo.count());
        counts.put("Comment", commentRepo.count());
        counts.put("User", userRepo.count());
        counts.put("FileObject", fileRepo.count());
        counts.put("Equipment", equipmentRepo.count());
        counts.put("LotoPoint", lotoPointRepo.count());
        counts.put("Loto", lotoRepo.count());
        counts.put("LotoStandard", lotoStandardRepo.count());
        counts.put("LotoSnapshot", lotoSnapshotRepo.count());
        counts.put("LotoBox", lotoBoxRepo.count());
        counts.put("Lock", lockRepo.count());
        counts.put("ZeroEnergy", zeroEnergyRepo.count());
        counts.put("HeatTrace", heatTraceRepo.count());
        counts.put("Highlight", highlightRepo.count());
        counts.put("ElectricalPanel", electricalPanelRepo.count());
        counts.put("EqBreaker", eqBreakerRepo.count());
        counts.put("HtPanel", htPanelRepo.count());
        counts.put("HtBreaker", htBreakerRepo.count());
        counts.put("EspDevice", espDeviceRepo.count());
        counts.put("LedStrip", ledStripRepo.count());
        counts.put("SafeWork", safeWorkRepo.count());
        counts.put("HotWork", hotWorkRepo.count());
        counts.put("ConfinedSpace", confinedSpaceRepo.count());
        counts.put("WorkRequest", workRequestRepo.count());
        counts.put("DailyPermitPackage", dailyPermitPackageRepo.count());
        return counts;
    }

    /**
     * Sync a single entity type to the server.
     * ManyToMany field changes are added to deferredManyToMany instead of being sent immediately,
     * ensuring all referenced entities exist on the server before join table entries are attempted.
     */
    private SyncResult syncEntityType(EntitySyncConfig config, List<FieldChange> deferredManyToMany) {
        JpaRepository<?, Long> repo = getRepositoryForType(config.entityType);
        if (repo == null) {
            log.warn("No repository found for type: {}", config.entityType);
            return new SyncResult(0, 0);
        }

        long sentCount = 0;
        long failedCount = 0;
        int page = 0;
        int batchIndex = 0;
        List<FieldChange> batchChanges = new ArrayList<>();

        while (true) {
            // Read a page of entities
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<?> entityPage = repo.findAll(pageable);

            if (entityPage.isEmpty()) {
                break;
            }

            // Create FieldChanges for each entity
            for (Object entity : entityPage.getContent()) {
                if (entity instanceof BaseIdEntity baseEntity) {
                    List<FieldChange> changes = createFieldChangesForEntity(config.entityType, baseEntity);
                    for (FieldChange change : changes) {
                        if ("ManyToMany".equals(change.getRelationshipType())) {
                            deferredManyToMany.add(change);
                        } else {
                            batchChanges.add(change);
                        }
                    }

                    // Send batch when it reaches size limit
                    if (batchChanges.size() >= BATCH_SIZE) {
                        BatchSendResult result = sendBatch(batchChanges);
                        sentCount += result.sent;
                        failedCount += result.failed;

                        // Track failed batches for potential retry
                        if (result.failed > 0 && result.errorMessage != null) {
                            currentStatus.recordFailedBatch(config.entityType, page, batchIndex, result.errorMessage);
                        }

                        batchChanges.clear();
                        batchIndex++;
                    }
                }
            }

            // Update progress tracking
            currentStatus.setLastCompletedPage(page);
            page++;

            // Safety check
            if (page > 10000) {
                log.warn("Too many pages for {}, stopping at page {}", config.entityType, page);
                break;
            }
        }

        // Send remaining changes
        if (!batchChanges.isEmpty()) {
            BatchSendResult result = sendBatch(batchChanges);
            sentCount += result.sent;
            failedCount += result.failed;

            if (result.failed > 0 && result.errorMessage != null) {
                currentStatus.recordFailedBatch(config.entityType, page, batchIndex, result.errorMessage);
            }
        }

        return new SyncResult(sentCount, failedCount);
    }

    /**
     * Create FieldChanges for a single entity (simulating CREATE).
     */
    private List<FieldChange> createFieldChangesForEntity(String entityType, BaseIdEntity entity) {
        List<FieldChange> changes = new ArrayList<>();

        Long entityId = entity.getId();
        if (entityId == null) {
            return changes;
        }

        // Add entity creation marker
        FieldChange createChange = new FieldChange(
            entityType, entityId, "_entity_",
            null, "CREATED",
            syncConfig.getMachineId(), syncConfig.getMachineName(),
            FieldChange.ChangeType.CREATE
        );
        changes.add(createChange);

        // Add all non-null field values
        for (CachedFieldInfo fieldInfo : getCachedFields(entity.getClass())) {
            if (fieldInfo.shouldTrack) {
                try {
                    Object value = fieldInfo.field.get(entity);
                    if (value != null) {
                        FieldChange fieldChange = new FieldChange(
                            entityType, entityId, fieldInfo.fieldName,
                            null, serializeValue(value),
                            syncConfig.getMachineId(), syncConfig.getMachineName(),
                            FieldChange.ChangeType.CREATE
                        );
                        fieldChange.setRelationshipType(fieldInfo.relationshipType);
                        changes.add(fieldChange);
                    }
                } catch (Exception e) {
                    log.debug("Error reading field {} on {}: {}",
                        fieldInfo.fieldName, entityType, e.getMessage());
                }
            }
        }

        return changes;
    }

    /**
     * Send a batch of FieldChanges to the server.
     */
    private BatchSendResult sendBatch(List<FieldChange> changes) {
        if (changes.isEmpty()) {
            return new BatchSendResult(0, 0, null);
        }

        try {
            String url = syncConfig.getSyncServerUrl() + "/api/sync/exchange";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Machine-Name", syncConfig.getMachineName());
            headers.set("Accept-Encoding", "gzip");

            Map<String, Object> request = new HashMap<>();
            request.put("machineId", syncConfig.getMachineId());
            request.put("machineName", syncConfig.getMachineName());
            request.put("changes", changes);
            request.put("batchMode", true);
            request.put("fullSync", true); // Indicate this is a full sync

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null && Boolean.TRUE.equals(body.get("success"))) {
                currentStatus.recordSuccessfulBatch();
                return new BatchSendResult(changes.size(), 0, null);
            } else {
                String error = body != null ? String.valueOf(body.get("errorMessage")) : "Unknown error";
                log.warn("Batch send failed: {}", error);
                return new BatchSendResult(0, changes.size(), error);
            }
        } catch (Exception e) {
            log.error("Error sending batch to server: {}", e.getMessage());
            return new BatchSendResult(0, changes.size(), e.getMessage());
        }
    }

    /**
     * Queue all files for upload.
     */
    private int queueFilesForUpload() {
        int queued = 0;
        int page = 0;

        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<FileObject> filePage = fileRepo.findAll(pageable);

            if (filePage.isEmpty()) {
                break;
            }

            for (FileObject file : filePage.getContent()) {
                try {
                    fileObjectSyncHandler.onLocalFileObjectChanged(file, true);
                    queued++;
                } catch (Exception e) {
                    log.warn("Failed to queue file {}: {}", file.getId(), e.getMessage());
                }
            }

            page++;

            if (page > 1000) {
                log.warn("Too many file pages, stopping at page {}", page);
                break;
            }
        }

        return queued;
    }

    /**
     * Get repository for an entity type.
     */
    @SuppressWarnings("unchecked")
    private JpaRepository<?, Long> getRepositoryForType(String entityType) {
        return switch (entityType) {
            case "Category" -> categoryRepo;
            case "Value" -> valueRepo;
            case "User" -> userRepo;
            case "FileObject" -> fileRepo;
            case "Equipment" -> equipmentRepo;
            case "LotoPoint" -> lotoPointRepo;
            case "Loto" -> lotoRepo;
            case "LotoStandard" -> lotoStandardRepo;
            case "LotoSnapshot" -> lotoSnapshotRepo;
            case "LotoBox" -> lotoBoxRepo;
            case "Lock" -> lockRepo;
            case "ZeroEnergy" -> zeroEnergyRepo;
            case "HeatTrace" -> heatTraceRepo;
            case "Highlight" -> highlightRepo;
            case "ElectricalPanel" -> electricalPanelRepo;
            case "EqBreaker" -> eqBreakerRepo;
            case "HtPanel" -> htPanelRepo;
            case "HtBreaker" -> htBreakerRepo;
            case "EspDevice" -> espDeviceRepo;
            case "LedStrip" -> ledStripRepo;
            case "SafeWork" -> safeWorkRepo;
            case "HotWork" -> hotWorkRepo;
            case "ConfinedSpace" -> confinedSpaceRepo;
            case "WorkRequest" -> workRequestRepo;
            case "DailyPermitPackage" -> dailyPermitPackageRepo;
            case "Comment" -> commentRepo;
            default -> null;
        };
    }

    // ==================== FIELD CACHING ====================

    private static class CachedFieldInfo {
        final Field field;
        final String fieldName;
        final boolean shouldTrack;
        final String relationshipType;

        CachedFieldInfo(Field field, boolean shouldTrack, String relationshipType) {
            this.field = field;
            this.fieldName = field.getName();
            this.shouldTrack = shouldTrack;
            this.relationshipType = relationshipType;
            field.setAccessible(true);
        }
    }

    private List<CachedFieldInfo> getCachedFields(Class<?> clazz) {
        return FIELD_CACHE.computeIfAbsent(clazz, this::buildFieldCache);
    }

    private List<CachedFieldInfo> buildFieldCache(Class<?> clazz) {
        List<CachedFieldInfo> cachedFields = new ArrayList<>();
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            for (Field field : current.getDeclaredFields()) {
                boolean shouldTrack = computeShouldTrackField(field);
                String relationshipType = computeRelationshipType(field);
                cachedFields.add(new CachedFieldInfo(field, shouldTrack, relationshipType));
            }
            current = current.getSuperclass();
        }
        return cachedFields;
    }

    private boolean computeShouldTrackField(Field field) {
        String fieldName = field.getName();
        if (EXCLUDED_FIELDS.contains(fieldName)) return false;
        if (field.isAnnotationPresent(Transient.class)) return false;
        if (field.isAnnotationPresent(JsonIgnore.class)) return false;
        if (Modifier.isStatic(field.getModifiers())) return false;
        if (Modifier.isFinal(field.getModifiers())) return false;

        // Skip OneToMany collections with mappedBy
        if (field.isAnnotationPresent(OneToMany.class)) {
            OneToMany oneToMany = field.getAnnotation(OneToMany.class);
            if (oneToMany.mappedBy() != null && !oneToMany.mappedBy().isEmpty()) {
                return false;
            }
        }

        return true;
    }

    private String computeRelationshipType(Field field) {
        if (field.isAnnotationPresent(ManyToOne.class)) return "ManyToOne";
        if (field.isAnnotationPresent(OneToMany.class)) return "OneToMany";
        if (field.isAnnotationPresent(ManyToMany.class)) return "ManyToMany";
        if (field.isAnnotationPresent(OneToOne.class)) return "OneToOne";
        return null;
    }

    // ==================== SERIALIZATION ====================

    private String serializeValue(Object value) {
        if (value == null) return null;

        try {
            // Handle entity references - just store ID
            if (value instanceof BaseIdEntity) {
                Long id = ((BaseIdEntity) value).getId();
                return id != null ? String.valueOf(id) : null;
            }

            // Handle collections of entities - store IDs
            if (value instanceof Collection) {
                Collection<?> col = (Collection<?>) value;
                if (!col.isEmpty()) {
                    Object first = col.iterator().next();
                    if (first instanceof BaseIdEntity) {
                        List<Long> ids = new ArrayList<>();
                        for (Object item : col) {
                            Long id = ((BaseIdEntity) item).getId();
                            if (id != null) ids.add(id);
                        }
                        return objectMapper.writeValueAsString(ids);
                    }
                }
            }

            // Handle enums
            if (value instanceof Enum) {
                return ((Enum<?>) value).name();
            }

            // Handle simple values
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("Error serializing value of type {}: {}",
                value.getClass().getSimpleName(), e.getMessage());
            return String.valueOf(value);
        }
    }

    // ==================== STATUS ====================

    public FullSyncStatus getStatus() {
        return currentStatus;
    }

    public boolean isInProgress() {
        return syncInProgress.get();
    }

    // ==================== DTOs ====================

    @Data
    public static class FullSyncStatus {
        private Instant startTime;
        private Instant endTime;
        private String phase;
        private String currentEntityType;
        private long totalEntities;
        private long entitiesSent;
        private long entitiesFailed;
        private int filesQueued;
        private boolean success;
        private List<String> errors = new ArrayList<>();

        // Batch tracking for resume capability
        private int lastCompletedEntityIndex = -1;  // Index in ENTITY_SYNC_ORDER
        private int lastCompletedPage = -1;         // Last page that was fully sent
        private int totalBatchesSent = 0;
        private int totalBatchesFailed = 0;
        private List<FailedBatch> failedBatches = new ArrayList<>();

        public void addError(String error) {
            errors.add(error);
        }

        public void recordFailedBatch(String entityType, int page, int batchIndex, String error) {
            failedBatches.add(new FailedBatch(entityType, page, batchIndex, error, Instant.now()));
            totalBatchesFailed++;
        }

        public void recordSuccessfulBatch() {
            totalBatchesSent++;
        }
    }

    @Data
    public static class FailedBatch {
        private final String entityType;
        private final int page;
        private final int batchIndex;
        private final String error;
        private final Instant failedAt;

        public FailedBatch(String entityType, int page, int batchIndex, String error, Instant failedAt) {
            this.entityType = entityType;
            this.page = page;
            this.batchIndex = batchIndex;
            this.error = error;
            this.failedAt = failedAt;
        }
    }

    private record EntitySyncConfig(String entityType, Class<?> entityClass) {}

    private record SyncResult(long sentCount, long failedCount) {}

    private record BatchSendResult(int sent, int failed, String errorMessage) {}
}
