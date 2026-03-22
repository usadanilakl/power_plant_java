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
import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.entities.fire_impairment.FireImpairment;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.scheduler.Flow;
import com.dk_power.power_plant_java.entities.scheduler.Task;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.equipment.*;
import com.dk_power.power_plant_java.repository.esp.EspDeviceRepo;
import com.dk_power.power_plant_java.repository.esp.LedStripRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.*;
import com.dk_power.power_plant_java.repository.permits.*;
import com.dk_power.power_plant_java.repository.base_repositories.CommentRepo;
import com.dk_power.power_plant_java.repository.base_repositories.EmailCorrespondenceRepo;
import com.dk_power.power_plant_java.repository.fire_impairment.FireImpairmentRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import com.dk_power.power_plant_java.repository.forms.FormContainerRepo;
import com.dk_power.power_plant_java.repository.scheduler.FlowRepository;
import com.dk_power.power_plant_java.repository.scheduler.TaskRepository;
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
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

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
    private final TransactionTemplate transactionTemplate;
    private final ClientDataExportService clientDataExportService;

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
    private final WorkAreaMapShapeRepo workAreaMapShapeRepo;
    private final WorkAreaRepo workAreaRepo;
    private final UserRepo userRepo;
    private final EspDeviceRepo espDeviceRepo;
    private final LedStripRepo ledStripRepo;
    private final SafeWorkRepo safeWorkRepo;
    private final HotWorkRepo hotWorkRepo;
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final WorkRequestRepo workRequestRepo;
    private final JhaRepo jhaRepo;
    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final CommentRepo commentRepo;
    private final EmailCorrespondenceRepo emailCorrespondenceRepo;
    private final FireImpairmentRepo fireImpairmentRepo;
    private final PrintableFormRepo printableFormRepo;
    private final FormContainerRepo formContainerRepo;
    private final JobLogRepo jobLogRepo;
    private final FlowRepository flowRepository;
    private final TaskRepository taskRepository;

    // Sync state
    private final AtomicBoolean syncInProgress = new AtomicBoolean(false);
    private volatile FullSyncStatus currentStatus = new FullSyncStatus();

    // Configuration
    private static final int BATCH_SIZE = 500; // Larger batches for better throughput (~5x fewer HTTP requests)
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
        new EntitySyncConfig("EmailCorrespondence", EmailCorrespondence.class),
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
        new EntitySyncConfig("WorkAreaMapShape", WorkAreaMapShape.class),
        new EntitySyncConfig("WorkArea", WorkArea.class),
        new EntitySyncConfig("EspDevice", EspDevice.class),
        new EntitySyncConfig("LedStrip", LedStrip.class),
        new EntitySyncConfig("SafeWork", SafeWork.class),
        new EntitySyncConfig("HotWork", HotWork.class),
        new EntitySyncConfig("ConfinedSpace", ConfinedSpace.class),
        new EntitySyncConfig("WorkRequest", WorkRequest.class),
        new EntitySyncConfig("Jha", Jha.class),
        new EntitySyncConfig("DailyPermitPackage", DailyPermitPackage.class),
        new EntitySyncConfig("JobLog", JobLog.class),
        new EntitySyncConfig("FireImpairment", FireImpairment.class),
        new EntitySyncConfig("PrintableForm", PrintableForm.class),
        new EntitySyncConfig("FormContainer", FormContainer.class),
        new EntitySyncConfig("Flow", Flow.class),
        new EntitySyncConfig("Task", Task.class)
    );

    /**
     * Sync method enum for choosing between FieldChange and Bulk Export approaches.
     */
    public enum SyncMethod {
        FIELD_CHANGES,  // Existing - slow but incremental
        BULK_EXPORT     // New - fast full transfer
    }

    /**
     * Start a full sync to the server asynchronously using FieldChange method.
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
     * Start a fast bulk export sync to the server.
     * Creates H2 database export + files ZIP and uploads both to server.
     * Much faster than FieldChange approach (2-5 minutes vs 30-60 minutes).
     *
     * @param force If true, overwrite existing server data
     */
    @Async
    public void startFullSyncViaBulkExport(boolean force) {
        startFullSyncViaBulkExport(force, BulkSyncMode.BOTH);
    }

    /**
     * Start a fast bulk export sync to the server with sync mode selection.
     * Creates H2 database export + files ZIP and uploads based on mode.
     *
     * @param force If true, overwrite existing server data
     * @param mode  What to sync: BOTH, DATABASE_ONLY, or FILES_ONLY
     */
    @Async
    public void startFullSyncViaBulkExport(boolean force, BulkSyncMode mode) {
        if (!syncInProgress.compareAndSet(false, true)) {
            log.warn("Full sync already in progress");
            return;
        }

        currentStatus = new FullSyncStatus();
        currentStatus.setStartTime(Instant.now());
        currentStatus.setPhase("Initializing bulk export");
        currentStatus.setSyncMethod("BULK_EXPORT");
        currentStatus.setSyncMode(mode.name());
        currentStatus.setProgressPercent(0);

        try {
            performBulkExportSync(force, mode);
        } catch (Exception e) {
            log.error("Bulk export sync failed: {}", e.getMessage(), e);
            currentStatus.setPhase("Failed: " + e.getMessage());
            currentStatus.setSuccess(false);
        } finally {
            currentStatus.setEndTime(Instant.now());
            syncInProgress.set(false);
        }
    }

    /**
     * Perform bulk export sync - create database and files exports, then upload.
     * @param force If true, overwrite existing server data
     * @param mode What to sync: BOTH, DATABASE_ONLY, or FILES_ONLY
     */
    private void performBulkExportSync(boolean force, BulkSyncMode mode) {
        log.info("Starting bulk export sync (mode={}) to server: {}", mode, syncConfig.getSyncServerUrl());

        // Calculate phase weights based on mode
        // BOTH: safety=5%, db=15%, archive=30%, upload=50%
        // DATABASE_ONLY: safety=10%, db=90%
        // FILES_ONLY: safety=5%, archive=35%, upload=60%
        int safetyWeight, dbWeight, archiveWeight, uploadWeight;
        if (mode == BulkSyncMode.DATABASE_ONLY) {
            safetyWeight = 10; dbWeight = 90; archiveWeight = 0; uploadWeight = 0;
        } else if (mode == BulkSyncMode.FILES_ONLY) {
            safetyWeight = 5; dbWeight = 0; archiveWeight = 35; uploadWeight = 60;
        } else {
            safetyWeight = 5; dbWeight = 15; archiveWeight = 30; uploadWeight = 50;
        }

        try {
            // Phase 1: Check server safety (0% -> safetyWeight%)
            currentStatus.setPhase("Checking server safety");
            currentStatus.setProgressPercent(0);
            String safetyError = checkServerImportSafety(force);
            if (safetyError != null) {
                currentStatus.setPhase("Failed: " + safetyError);
                currentStatus.setSuccess(false);
                return;
            }
            currentStatus.setProgressPercent(safetyWeight);

            int progressBase = safetyWeight;
            BulkImportResult dbResult = null;

            // Phase 2: Database (skip if FILES_ONLY)
            if (mode != BulkSyncMode.FILES_ONLY) {
                currentStatus.setPhase("Creating database export");
                log.info("Creating H2 database export...");
                byte[] dbBackup = clientDataExportService.createExportBackup();
                log.info("Database export created: {} bytes", dbBackup.length);
                currentStatus.setProgressPercent(progressBase + dbWeight / 2);

                currentStatus.setPhase("Uploading database to server");
                log.info("Uploading database export to server ({} bytes)...", dbBackup.length);
                dbResult = uploadDatabaseOnly(dbBackup, force);
                if (!dbResult.success()) {
                    currentStatus.setPhase("Failed: " + dbResult.message());
                    currentStatus.setSuccess(false);
                    log.error("Database upload failed: {}", dbResult.message());
                    return;
                }
                log.info("Database uploaded: {} entities", dbResult.entitiesImported());

                currentStatus.setDatabaseEntitiesSent(dbResult.entitiesImported());
                currentStatus.setTotalDatabaseEntities(dbResult.entitiesImported());
                currentStatus.setDatabaseComplete(true);
                progressBase += dbWeight;
                currentStatus.setProgressPercent(progressBase);
            }

            // Phase 3: Files (skip if DATABASE_ONLY)
            // Direct upload loop — no queue delay, uploads files immediately in a tight loop.
            int filesUploaded = 0;
            if (mode != BulkSyncMode.DATABASE_ONLY) {
                currentStatus.setPhase("Uploading files directly");
                log.info("Starting direct file upload to server...");

                filesUploaded = uploadAllFilesDirect();
                currentStatus.setFilesQueued(filesUploaded);
                currentStatus.setTotalFiles(filesUploaded);
                currentStatus.setFilesComplete(true);

                currentStatus.setProgressPercent(progressBase + archiveWeight + uploadWeight);
                log.info("Direct file upload complete: {} files uploaded", filesUploaded);
            }

            // Final result
            currentStatus.setProgressPercent(100);

            long totalEntities = dbResult != null ? dbResult.entitiesImported() : 0;

            currentStatus.setPhase("Complete");
            currentStatus.setSuccess(true);
            currentStatus.setEntitiesSent(totalEntities);
            currentStatus.setFilesQueued(filesUploaded);
            log.info("Bulk export sync complete (mode={}): {} entities, {} files uploaded",
                mode, totalEntities, filesUploaded);

        } catch (Exception e) {
            log.error("Bulk export sync error: {}", e.getMessage(), e);
            currentStatus.setPhase("Failed: " + e.getMessage());
            currentStatus.setSuccess(false);
            throw new RuntimeException("Bulk export sync failed", e);
        }
    }

    /**
     * Check if server is safe for import (empty or force enabled).
     * Returns the server message, or null if safe.
     */
    private String checkServerImportSafety(boolean force) {
        try {
            String url = syncConfig.getSyncServerUrl() + "/api/resync/import/safety-check?force=" + force;
            log.info("Safety check: {} (force={})", url, force);

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null) {
                Boolean safe = (Boolean) body.get("safe");
                String message = (String) body.get("message");
                log.info("Server safety check: safe={}, message={}", safe, message);
                if (Boolean.TRUE.equals(safe)) {
                    return null; // safe
                }
                return message != null ? message : "Server rejected import (safe=false)";
            }
            return "Empty response from server safety check";
        } catch (Exception e) {
            log.error("Safety check failed: {}", e.getMessage(), e);
            return "Safety check request failed: " + e.getMessage();
        }
    }

    /**
     * Upload only the database backup to the server.
     */
    private BulkImportResult uploadDatabaseOnly(byte[] dbBackup, boolean force) {
        try {
            String url = syncConfig.getSyncServerUrl() + "/api/resync/import/database?force=" + force;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(dbBackup) {
                @Override
                public String getFilename() {
                    return "database.zip";
                }
            });

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null) {
                boolean success = Boolean.TRUE.equals(responseBody.get("success"));
                String message = (String) responseBody.get("message");
                long entitiesImported = responseBody.get("entitiesImported") != null ?
                    ((Number) responseBody.get("entitiesImported")).longValue() : 0;
                long durationMs = responseBody.get("durationMs") != null ?
                    ((Number) responseBody.get("durationMs")).longValue() : 0;

                return new BulkImportResult(success, message, entitiesImported, 0, durationMs);
            }

            return new BulkImportResult(false, "Empty response from server", 0, 0, 0);
        } catch (Exception e) {
            log.error("Database upload failed: {}", e.getMessage());
            return new BulkImportResult(false, "Database upload failed: " + e.getMessage(), 0, 0, 0);
        }
    }

    /**
     * Get export statistics without performing the export.
     * Useful for UI display before starting.
     */
    public BulkExportStats getBulkExportStats() {
        try {
            ClientDataExportService.ExportStats dbStats = clientDataExportService.getExportStats();
            long fileCount = fileRepo.count();

            return new BulkExportStats(
                dbStats.getTotalEntities(),
                dbStats.getTotalJoinRecords(),
                (int) fileCount,
                0 // individual uploads — total size not pre-computed
            );
        } catch (Exception e) {
            log.error("Failed to get export stats: {}", e.getMessage());
            return new BulkExportStats(0, 0, 0, 0);
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
        AtomicLong totalEntitiesProcessed = new AtomicLong(0);
        AtomicLong totalChangesSent = new AtomicLong(0);
        AtomicLong totalFailed = new AtomicLong(0);
        List<FieldChange> deferredManyToManyChanges = new ArrayList<>();

        for (int i = 0; i < ENTITY_SYNC_ORDER.size(); i++) {
            EntitySyncConfig config = ENTITY_SYNC_ORDER.get(i);
            currentStatus.setPhase("Syncing " + config.entityType);
            currentStatus.setCurrentEntityType(config.entityType);
            currentStatus.setLastCompletedPage(-1); // Reset page tracking for new entity type

            try {
                SyncResult result = syncEntityType(config, deferredManyToManyChanges);
                totalEntitiesProcessed.addAndGet(result.entitiesProcessed);
                totalChangesSent.addAndGet(result.changesSent);
                totalFailed.addAndGet(result.failedCount);
                currentStatus.setEntitiesSent(totalEntitiesProcessed.get());
                currentStatus.setChangesSent(totalChangesSent.get());
                currentStatus.setEntitiesFailed(totalFailed.get());
                currentStatus.setLastCompletedEntityIndex(i); // Track completed entity type

                log.info("Synced {}: {} entities ({} changes), {} failed",
                    config.entityType, result.entitiesProcessed, result.changesSent, result.failedCount);
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
                totalChangesSent.addAndGet(result.sent);
                totalFailed.addAndGet(result.failed);
                currentStatus.setChangesSent(totalChangesSent.get());

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
        log.info("Full sync complete: {} entities ({} changes) sent, {} failed, {} files queued",
            totalEntitiesProcessed.get(), totalChangesSent.get(), totalFailed.get(), filesQueued);
    }

    /**
     * Count entities for each type.
     */
    private Map<String, Long> countAllEntities() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("Category", categoryRepo.count());
        counts.put("Value", valueRepo.count());
        counts.put("Comment", commentRepo.count());
        counts.put("EmailCorrespondence", emailCorrespondenceRepo.count());
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
        counts.put("WorkAreaMapShape", workAreaMapShapeRepo.count());
        counts.put("WorkArea", workAreaRepo.count());
        counts.put("EspDevice", espDeviceRepo.count());
        counts.put("LedStrip", ledStripRepo.count());
        counts.put("SafeWork", safeWorkRepo.count());
        counts.put("HotWork", hotWorkRepo.count());
        counts.put("ConfinedSpace", confinedSpaceRepo.count());
        counts.put("WorkRequest", workRequestRepo.count());
        counts.put("DailyPermitPackage", dailyPermitPackageRepo.count());
        counts.put("JobLog", jobLogRepo.count());
        counts.put("FireImpairment", fireImpairmentRepo.count());
        counts.put("PrintableForm", printableFormRepo.count());
        counts.put("FormContainer", formContainerRepo.count());
        counts.put("Flow", flowRepository.count());
        counts.put("Task", taskRepository.count());
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
            return new SyncResult(0, 0, 0);
        }

        long entitiesProcessed = 0;
        long changesSent = 0;
        long failedCount = 0;
        int page = 0;
        int batchIndex = 0;
        List<FieldChange> batchChanges = new ArrayList<>();

        while (true) {
            // Read a page of entities and create FieldChanges within a transaction.
            // This is critical: @ManyToMany defaults to FetchType.LAZY, so accessing
            // lazy collections via reflection requires an active persistence context.
            // Without a transaction, entities are detached after findAll() returns,
            // and lazy loading throws LazyInitializationException (silently caught).
            final Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            final int currentPage = page;

            // Use array to capture entity count from lambda
            final long[] pageEntityCount = {0};
            List<FieldChange> pageChanges = transactionTemplate.execute(status -> {
                status.setRollbackOnly(); // Read-only — no writes needed
                Page<?> entityPage = repo.findAll(pageable);

                if (entityPage.isEmpty()) {
                    return Collections.<FieldChange>emptyList();
                }

                pageEntityCount[0] = entityPage.getNumberOfElements();
                List<FieldChange> result = new ArrayList<>();
                for (Object entity : entityPage.getContent()) {
                    if (entity instanceof BaseIdEntity baseEntity) {
                        result.addAll(createFieldChangesForEntity(config.entityType, baseEntity));
                    }
                }
                return result;
            });

            if (pageChanges == null || pageChanges.isEmpty()) {
                break;
            }

            entitiesProcessed += pageEntityCount[0];

            // Separate ManyToMany changes for deferred sending
            for (FieldChange change : pageChanges) {
                if ("ManyToMany".equals(change.getRelationshipType())) {
                    deferredManyToMany.add(change);
                } else {
                    batchChanges.add(change);
                }

                // Send batch when it reaches size limit
                if (batchChanges.size() >= BATCH_SIZE) {
                    BatchSendResult result = sendBatch(batchChanges);
                    changesSent += result.sent;
                    failedCount += result.failed;

                    // Track failed batches for potential retry
                    if (result.failed > 0 && result.errorMessage != null) {
                        currentStatus.recordFailedBatch(config.entityType, currentPage, batchIndex, result.errorMessage);
                    }

                    batchChanges.clear();
                    batchIndex++;
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
            changesSent += result.sent;
            failedCount += result.failed;

            if (result.failed > 0 && result.errorMessage != null) {
                currentStatus.recordFailedBatch(config.entityType, page, batchIndex, result.errorMessage);
            }
        }

        return new SyncResult(entitiesProcessed, changesSent, failedCount);
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
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
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
     * Upload all files directly to the server in a tight loop (no queue delay).
     * Used by bulk export sync for speed — bypasses PendingFileSync queue entirely.
     */
    private int uploadAllFilesDirect() {
        int uploaded = 0;
        int failed = 0;
        int page = 0;

        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<FileObject> filePage = fileRepo.findAll(pageable);

            if (filePage.isEmpty()) {
                break;
            }

            for (FileObject fo : filePage.getContent()) {
                List<File> files = fileObjectSyncHandler.getAllPhysicalFiles(fo);
                for (File file : files) {
                    try {
                        fileObjectSyncHandler.uploadSingleFile(
                            file, "FileObject", fo.getId(), file.getAbsolutePath());
                        uploaded++;
                        // Update filesArchived so UI can show progress
                        currentStatus.setFilesArchived(uploaded);
                    } catch (Exception e) {
                        log.warn("Failed to upload {}: {}", file.getName(), e.getMessage());
                        failed++;
                    }
                }
                currentStatus.setPhase(String.format(
                    "Uploading files: %d uploaded, %d failed", uploaded, failed));
            }

            page++;

            if (page > 1000) {
                log.warn("Too many file pages, stopping at page {}", page);
                break;
            }
        }

        if (failed > 0) {
            log.warn("Direct file upload finished: {} uploaded, {} failed", uploaded, failed);
        }
        return uploaded;
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
            case "WorkAreaMapShape" -> workAreaMapShapeRepo;
            case "WorkArea" -> workAreaRepo;
            case "EspDevice" -> espDeviceRepo;
            case "LedStrip" -> ledStripRepo;
            case "SafeWork" -> safeWorkRepo;
            case "HotWork" -> hotWorkRepo;
            case "ConfinedSpace" -> confinedSpaceRepo;
            case "WorkRequest" -> workRequestRepo;
            case "Jha" -> jhaRepo;
            case "DailyPermitPackage" -> dailyPermitPackageRepo;
            case "JobLog" -> jobLogRepo;
            case "Comment" -> commentRepo;
            case "EmailCorrespondence" -> emailCorrespondenceRepo;
            case "FireImpairment" -> fireImpairmentRepo;
            case "PrintableForm" -> printableFormRepo;
            case "FormContainer" -> formContainerRepo;
            case "Flow" -> flowRepository;
            case "Task" -> taskRepository;
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
        private long entitiesSent;        // Actual entities processed
        private long changesSent;          // FieldChange records sent (multiple per entity)
        private long entitiesFailed;
        private int filesQueued;
        private boolean success;
        private List<String> errors = new ArrayList<>();
        private String syncMethod = "FIELD_CHANGES";  // FIELD_CHANGES or BULK_EXPORT

        // NEW: Direct progress for the progress bar (0-100)
        private int progressPercent;

        // NEW: Sync mode for bulk export
        private String syncMode = "BOTH";  // BOTH, DATABASE_ONLY, FILES_ONLY

        // NEW: Separate database tracking
        private long totalDatabaseEntities;
        private long databaseEntitiesSent;
        private boolean databaseComplete;

        // NEW: Separate file tracking
        private long totalFiles;
        private long filesArchived;        // Files added to ZIP during archive phase
        private long totalFileBytes;
        private long fileBytesSent;
        private boolean filesComplete;

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

    /**
     * Sync mode for bulk export.
     */
    public enum BulkSyncMode {
        BOTH,           // Sync database + files (default)
        DATABASE_ONLY,  // Sync only database
        FILES_ONLY      // Sync only files
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

    private record SyncResult(long entitiesProcessed, long changesSent, long failedCount) {}

    private record BatchSendResult(int sent, int failed, String errorMessage) {}

    /**
     * Result of bulk import operation from server.
     */
    public record BulkImportResult(
        boolean success,
        String message,
        long entitiesImported,
        long filesImported,
        long durationMs
    ) {}

    /**
     * Statistics for bulk export before starting.
     */
    public record BulkExportStats(
        long totalEntities,
        long totalJoinRecords,
        int fileCount,
        long totalFileSize
    ) {}

}
