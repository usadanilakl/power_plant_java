package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.sync.SyncUpdateController;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.Peer;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FieldSyncService {

    private final FieldChangeRepository fieldChangeRepository;
    private final PeerDiscoveryService peerDiscoveryService;
    private final ServiceFacade serviceFacade;
    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final SyncContext syncContext;
    private final SyncUpdateController syncUpdateController;
    private final ApplicationEventPublisher eventPublisher;
    private final TransactionTemplate transactionTemplate;
    private final NgFileService ngFileService;
    private final FileRepo fileRepo;
    private final FileObjectSyncHandler fileObjectSyncHandler;
    private final EntityTableRegistry entityTableRegistry;
    private final CategoryValueMergeService categoryValueMergeService;
    private final WorkRequestMergeService workRequestMergeService;
    private final JhaMergeService jhaMergeService;
    private final EmailCorrespondenceMergeService emailCorrespondenceMergeService;

    @PersistenceContext
    private EntityManager entityManager;

    private volatile boolean syncing = false;

    public FieldSyncService(
            FieldChangeRepository fieldChangeRepository,
            PeerDiscoveryService peerDiscoveryService,
            ServiceFacade serviceFacade,
            SyncConfig syncConfig,
            ObjectMapper objectMapper,
            RestTemplate restTemplate,
            SyncContext syncContext,
            SyncUpdateController syncUpdateController,
            ApplicationEventPublisher eventPublisher,
            PlatformTransactionManager transactionManager,
            NgFileService ngFileService,
            FileRepo fileRepo,
            FileObjectSyncHandler fileObjectSyncHandler,
            EntityTableRegistry entityTableRegistry,
            CategoryValueMergeService categoryValueMergeService,
            WorkRequestMergeService workRequestMergeService,
            JhaMergeService jhaMergeService,
            EmailCorrespondenceMergeService emailCorrespondenceMergeService) {
        this.fieldChangeRepository = fieldChangeRepository;
        this.peerDiscoveryService = peerDiscoveryService;
        this.serviceFacade = serviceFacade;
        this.syncConfig = syncConfig;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
        this.syncContext = syncContext;
        this.syncUpdateController = syncUpdateController;
        this.eventPublisher = eventPublisher;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        // REQUIRES_NEW ensures entity application runs in its own transaction.
        // Without this, when called from @Transactional methods (e.g. HubSyncService.syncExchange),
        // a rollback here would also roll back the caller's saved FieldChanges.
        this.transactionTemplate.setPropagationBehavior(
            org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.ngFileService = ngFileService;
        this.fileRepo = fileRepo;
        this.fileObjectSyncHandler = fileObjectSyncHandler;
        this.entityTableRegistry = entityTableRegistry;
        this.categoryValueMergeService = categoryValueMergeService;
        this.workRequestMergeService = workRequestMergeService;
        this.jhaMergeService = jhaMergeService;
        this.emailCorrespondenceMergeService = emailCorrespondenceMergeService;
    }

    /**
     * Sync with all known peers on application startup.
     * Only runs if server sync is disabled (peer-to-peer mode).
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (syncConfig.isHubMode()) {
            log.info("Hub mode - skipping client-side startup sync (hub receives data via bulk import and SSE)");
            return;
        }
        if (syncConfig.isServerSyncEnabled()) {
            log.info("Server sync enabled - skipping peer-to-peer startup sync");
            return;
        }

        log.info("Application ready - syncing with all known peers to catch up on missed changes");
        // Small delay to ensure all services are fully initialized
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }
        syncWithAllPeers();
    }

    /**
     * Sync with a peer when it comes online (new or returning).
     * Only runs if server sync is disabled (peer-to-peer mode).
     */
    @Async
    @EventListener
    public void onPeerOnline(SyncEventPublisher.PeerOnlineEvent event) {
        if (syncConfig.isHubMode() || syncConfig.isServerSyncEnabled()) {
            return; // Hub or server sync handles this
        }

        log.info("Peer online event: {} ({}) - triggering sync",
            event.getPeer().getMachineName(), event.getPeer().getMachineId());
        try {
            syncWithPeer(event.getPeer());
        } catch (Exception e) {
            log.error("Failed to sync with newly online peer {} ({}): {}",
                event.getPeer().getMachineName(), event.getPeer().getMachineId(), e.getMessage());
        }
    }

    /**
     * Event-driven sync: triggered when changes are detected locally.
     * Only runs if server sync is disabled (peer-to-peer mode).
     */
    @Async
    @EventListener
    public void onChangesDetected(SyncEventPublisher.ChangesDetectedEvent event) {
        if (syncConfig.isServerSyncEnabled()) {
            return; // CentralSyncService handles this
        }

        log.info("onChangesDetected event received with {} changes",
            event.getChanges() != null ? event.getChanges().size() : 0);

        if (event.getChanges() == null || event.getChanges().isEmpty()) {
            log.info("No changes in event, skipping sync");
            return;
        }

        log.info("Changes detected, triggering sync with peers");
        syncWithAllPeers();
    }

    /**
     * Sync with all active peers.
     * Called on-demand when changes are detected (event-driven).
     */
    public void syncWithAllPeers() {
        log.info("syncWithAllPeers called, syncing={}", syncing);

        if (syncing) {
            log.info("Sync already in progress, skipping");
            return;
        }

        List<Peer> activePeers = peerDiscoveryService.getActivePeers();
        log.info("Found {} active peers", activePeers.size());

        if (activePeers.isEmpty()) {
            log.debug("No active peers found for sync");
            return;
        }

        syncing = true;
        log.info("Starting field sync with {} active peer(s)", activePeers.size());

        int successCount = 0;
        for (Peer peer : activePeers) {
            try {
                syncWithPeer(peer);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to sync with peer {} ({}): {}",
                    peer.getMachineName(), peer.getMachineId(), e.getMessage());
                peerDiscoveryService.markPeerError(peer.getMachineId());
            }
        }

        syncing = false;
        log.info("Field sync completed: {}/{} peers successful", successCount, activePeers.size());
    }

    /**
     * Sync with a specific peer
     */
    @Transactional
    public SyncResult syncWithPeer(Peer peer) {
        log.info("Syncing with peer: {} ({}) at {}",
            peer.getMachineName(), peer.getMachineId(), peer.getBaseUrl());

        peerDiscoveryService.markPeerSyncing(peer.getMachineId());
        SyncResult result = new SyncResult();

        try {
            // 1. Get changes we need to send to this peer
            List<FieldChange> outgoingChanges = fieldChangeRepository
                .findChangesNotSyncedTo(peer.getMachineId());
            result.setChangesSent(outgoingChanges.size());

            // 2. Send our changes and receive their changes
            List<FieldChange> incomingChanges = exchangeChanges(peer, outgoingChanges);
            result.setChangesReceived(incomingChanges != null ? incomingChanges.size() : 0);

            // 3. Apply incoming changes with conflict resolution
            if (incomingChanges != null && !incomingChanges.isEmpty()) {
                int applied = applyIncomingChanges(incomingChanges);
                result.setChangesApplied(applied);
            }

            // 4. Mark our changes as synced to this peer
            for (FieldChange change : outgoingChanges) {
                change.addSyncedMachine(peer.getMachineId());
            }
            if (!outgoingChanges.isEmpty()) {
                fieldChangeRepository.saveAll(outgoingChanges);
            }

            // Update peer status
            peerDiscoveryService.updatePeerSyncTime(peer.getMachineId());
            result.setSuccess(true);

            log.info("Sync complete with {}: sent={}, received={}, applied={}",
                peer.getMachineName(), result.getChangesSent(),
                result.getChangesReceived(), result.getChangesApplied());

        } catch (Exception e) {
            peerDiscoveryService.markPeerError(peer.getMachineId());
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            throw e;
        }

        return result;
    }

    /**
     * Exchange changes with a peer via REST API
     */
    private List<FieldChange> exchangeChanges(Peer peer, List<FieldChange> outgoingChanges) {
        String url = peer.getBaseUrl() + "/api/field-sync/exchange";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        headers.set("X-Machine-Name", syncConfig.getMachineName());

        Map<String, Object> request = new HashMap<>();
        request.put("machineId", syncConfig.getMachineId());
        request.put("machineName", syncConfig.getMachineName());
        request.put("changes", outgoingChanges);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<List<FieldChange>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity,
                new ParameterizedTypeReference<List<FieldChange>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Error exchanging changes with {}: {}", peer.getMachineId(), e.getMessage());
            throw new RuntimeException("Sync exchange failed: " + e.getMessage(), e);
        }
    }

    /**
     * Apply incoming changes with Last-Writer-Wins per field.
     * Wrapped in sync context to prevent triggering broadcasts for incoming changes.
     *
     * This method uses programmatic transaction management to work correctly
     * when called from non-Spring-managed threads (e.g., SSE client thread).
     *
     * @return number of changes actually applied
     */
    public int applyIncomingChanges(List<FieldChange> incomingChanges) {
        // Mark that we're processing sync - prevents infinite loop
        // When entities are saved, the EntityListener won't broadcast these changes
        syncContext.startSync();
        try {
            // Use programmatic transaction to ensure it works from any thread
            Integer result = transactionTemplate.execute(status -> {
                try {
                    return applyIncomingChangesInternal(incomingChanges);
                } catch (Exception e) {
                    log.error("Error applying incoming changes, rolling back: {}", e.getMessage(), e);
                    status.setRollbackOnly();
                    return 0;
                }
            });
            return result != null ? result : 0;
        } catch (org.springframework.transaction.UnexpectedRollbackException e) {
            // setRollbackOnly() inside the lambda causes TransactionTemplate.execute()
            // to throw UnexpectedRollbackException when it tries to commit.
            // This is expected when applyIncomingChangesInternal fails — the transaction
            // was already rolled back, just return 0 and let the caller continue.
            log.warn("Transaction rolled back during incoming changes (batch of {}): {}",
                incomingChanges.size(), e.getMessage());
            return 0;
        } finally {
            syncContext.endSync();
        }
    }

    /**
     * Internal method that actually applies the changes.
     * Uses batch queries for conflict resolution to eliminate N+1 query problem.
     *
     * Two-pass approach:
     * 1. First pass: Apply all non-ManyToMany changes (entity creations, updates, deletes)
     * 2. Second pass: Apply ManyToMany changes after all referenced entities exist
     *
     * This prevents foreign key constraint violations when ManyToMany references
     * entities that are created in the same sync batch.
     */
    private int applyIncomingChangesInternal(List<FieldChange> incomingChanges) {
        // Clear the persistence context to ensure fresh state for this batch.
        // This is important when SSE batches arrive in quick succession -
        // entities created in one batch need to be loadable from DB in the next.
        entityManager.clear();

        // ==================== SINGLE-PASS CATEGORIZATION ====================
        // Categorize all changes in one pass instead of multiple stream iterations
        List<FieldChange> manyToManyChanges = new ArrayList<>();
        List<FieldChange> nonManyToManyChanges = new ArrayList<>();
        List<FieldChange> fileObjectChanges = new ArrayList<>();
        List<FieldChange> valueNameChanges = new ArrayList<>();

        for (FieldChange change : incomingChanges) {
            // Categorize by relationship type
            if ("ManyToMany".equals(change.getRelationshipType())) {
                manyToManyChanges.add(change);
            } else {
                nonManyToManyChanges.add(change);
            }

            // Collect FileObject changes for file sync
            if ("FileObject".equals(change.getEntityType())) {
                fileObjectChanges.add(change);
            }

            // Collect Value name changes for file structure cleanup
            if ("Value".equals(change.getEntityType())
                    && "name".equals(change.getFieldName())
                    && change.getOldValue() != null
                    && change.getNewValue() != null) {
                valueNameChanges.add(change);
            }
        }
        // ==================== END SINGLE-PASS CATEGORIZATION ====================

        // Group non-ManyToMany changes by entity type first
        Map<String, Map<Long, List<FieldChange>>> changesByEntity = nonManyToManyChanges.stream()
            .collect(Collectors.groupingBy(
                FieldChange::getEntityType,
                Collectors.groupingBy(FieldChange::getEntityId)
            ));

        int totalApplied = 0;

        // Collect broadcasts to send AFTER transaction commits
        List<Runnable> pendingBroadcasts = new ArrayList<>();

        // Collect failed ManyToOne references for retry in third pass
        List<FailedManyToOneReference> failedManyToOneRefs = new ArrayList<>();

        // FIRST PASS: Process non-ManyToMany changes in SYNC_ORDER (dependency order)
        // This ensures base entities (Category, Value, FileObject) are created before
        // entities that reference them (Equipment, LotoPoint), preventing ManyToOne failures.
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            Map<Long, List<FieldChange>> changesById = changesByEntity.get(entityType);
            if (changesById == null || changesById.isEmpty()) {
                continue; // No changes for this entity type
            }

            // Batch fetch latest changes for all entities of this type (eliminates N+1)
            List<Long> entityIds = new ArrayList<>(changesById.keySet());
            Map<String, FieldChange> latestChangesMap = batchFetchLatestChanges(entityType, entityIds);

            for (Map.Entry<Long, List<FieldChange>> idEntry : changesById.entrySet()) {
                Long entityId = idEntry.getKey();
                List<FieldChange> changes = idEntry.getValue();

                int applied = applyEntityChangesBatched(entityType, entityId, changes, latestChangesMap, failedManyToOneRefs);
                totalApplied += applied;

                // Queue broadcast for after transaction commits
                if (applied > 0) {
                    // Capture values for lambda
                    final String type = entityType;
                    final Long id = entityId;
                    final List<FieldChange> changeList = new ArrayList<>(changes);
                    pendingBroadcasts.add(() -> syncUpdateController.broadcastEntityUpdate(type, id, changeList));
                }
            }
        }

        // Process any entity types not in SYNC_ORDER (edge case)
        Set<String> processedTypes = new HashSet<>(entityTableRegistry.getSyncOrder());
        for (Map.Entry<String, Map<Long, List<FieldChange>>> entityEntry : changesByEntity.entrySet()) {
            String entityType = entityEntry.getKey();
            if (processedTypes.contains(entityType)) {
                continue; // Already processed in ordered pass
            }

            Map<Long, List<FieldChange>> changesById = entityEntry.getValue();
            List<Long> entityIds = new ArrayList<>(changesById.keySet());
            Map<String, FieldChange> latestChangesMap = batchFetchLatestChanges(entityType, entityIds);

            for (Map.Entry<Long, List<FieldChange>> idEntry : changesById.entrySet()) {
                Long entityId = idEntry.getKey();
                List<FieldChange> changes = idEntry.getValue();

                int applied = applyEntityChangesBatched(entityType, entityId, changes, latestChangesMap, failedManyToOneRefs);
                totalApplied += applied;

                if (applied > 0) {
                    final String type = entityType;
                    final Long id = entityId;
                    final List<FieldChange> changeList = new ArrayList<>(changes);
                    pendingBroadcasts.add(() -> syncUpdateController.broadcastEntityUpdate(type, id, changeList));
                }
            }
        }

        // Flush to ensure all entities are persisted before ManyToMany pass
        if (!manyToManyChanges.isEmpty()) {
            try {
                entityManager.flush();
            } catch (Exception e) {
                log.warn("Flush failed before ManyToMany pass: {}", e.getMessage());
                entityManager.clear();
            }
        }

        // SECOND PASS: Process ManyToMany changes (after all entities exist)
        if (!manyToManyChanges.isEmpty()) {
            log.debug("Second pass: applying {} ManyToMany changes", manyToManyChanges.size());

            // Group ManyToMany changes by entity
            Map<String, Map<Long, List<FieldChange>>> manyToManyByEntity = manyToManyChanges.stream()
                .collect(Collectors.groupingBy(
                    FieldChange::getEntityType,
                    Collectors.groupingBy(FieldChange::getEntityId)
                ));

            for (Map.Entry<String, Map<Long, List<FieldChange>>> entityEntry : manyToManyByEntity.entrySet()) {
                String entityType = entityEntry.getKey();
                Map<Long, List<FieldChange>> changesById = entityEntry.getValue();

                List<Long> entityIds = new ArrayList<>(changesById.keySet());
                Map<String, FieldChange> latestChangesMap = batchFetchLatestChanges(entityType, entityIds);

                for (Map.Entry<Long, List<FieldChange>> idEntry : changesById.entrySet()) {
                    Long entityId = idEntry.getKey();
                    List<FieldChange> changes = idEntry.getValue();

                    // Pass null for failedManyToOneRefs - ManyToMany uses different logic
                    int applied = applyEntityChangesBatched(entityType, entityId, changes, latestChangesMap, null);
                    totalApplied += applied;

                    if (applied > 0) {
                        final String type = entityType;
                        final Long id = entityId;
                        final List<FieldChange> changeList = new ArrayList<>(changes);
                        pendingBroadcasts.add(() -> syncUpdateController.broadcastEntityUpdate(type, id, changeList));
                    }
                }
            }
        }

        // THIRD PASS: Retry failed ManyToOne references now that all entities should exist.
        // IMPORTANT: Entities stored in failedManyToOneRefs may have been DETACHED by
        // entityManager.clear() calls during createEntityFromSync(). We must re-load them
        // from the database to get a managed instance before modifying and saving.
        if (!failedManyToOneRefs.isEmpty()) {
            try {
                entityManager.flush(); // Ensure all entities are persisted before retry
            } catch (Exception e) {
                log.warn("Flush failed before ManyToOne retry pass: {}", e.getMessage());
                entityManager.clear();
            }
            log.debug("Third pass: retrying {} failed ManyToOne references", failedManyToOneRefs.size());

            for (FailedManyToOneReference failedRef : failedManyToOneRefs) {
                try {
                    // Re-fetch the referenced entity - it should exist now
                    Object referencedEntity = entityManager.find(failedRef.field.getType(), failedRef.referencedId);

                    if (referencedEntity != null) {
                        // Re-load the owning entity to get a MANAGED instance.
                        // The original failedRef.entity may be detached due to entityManager.clear()
                        // calls in createEntityFromSync(). Setting a field on a detached entity
                        // via reflection does NOT persist the change.
                        String entityType = failedRef.change.getEntityType();
                        SyncableService service = serviceFacade.getService(entityType);
                        if (service == null) {
                            log.warn("No service for {} - cannot retry ManyToOne reference", entityType);
                            continue;
                        }

                        BaseIdEntity managedEntity = (BaseIdEntity) service.getEntityById(failedRef.entity.getId());
                        if (managedEntity == null) {
                            log.warn("Could not re-load {}#{} for ManyToOne retry",
                                entityType, failedRef.entity.getId());
                            continue;
                        }

                        failedRef.field.setAccessible(true);
                        failedRef.field.set(managedEntity, referencedEntity);
                        service.save(managedEntity);
                        saveIncomingChange(failedRef.change);
                        totalApplied++;
                        log.debug("Retry succeeded: set {}.{} -> entity #{}",
                            entityType, failedRef.change.getFieldName(), failedRef.referencedId);
                    } else {
                        log.debug("Retry failed: referenced entity {}#{} still not found (will resolve in next sync)",
                            failedRef.field.getType().getSimpleName(), failedRef.referencedId);
                    }
                } catch (Exception e) {
                    log.error("Error retrying ManyToOne reference {}.{}: {}",
                        failedRef.change.getEntityType(),
                        failedRef.change.getFieldName(),
                        e.getMessage());
                }
            }
        }

        // Log batch summary
        log.info("Sync batch: applied {} of {} changes, {} ManyToOne deferred to retry",
            totalApplied, incomingChanges.size(), failedManyToOneRefs.size());

        // Register callback to broadcast AFTER transaction commits
        // This ensures frontend API calls will see the committed data
        if (!pendingBroadcasts.isEmpty() && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.debug("Transaction committed, broadcasting {} entity updates", pendingBroadcasts.size());
                    pendingBroadcasts.forEach(Runnable::run);

                    // Publish FileObject sync event for file download handling
                    if (!fileObjectChanges.isEmpty()) {
                        log.debug("Publishing FileObjectSyncEvent with {} changes", fileObjectChanges.size());
                        eventPublisher.publishEvent(
                            new FileObjectSyncHandler.FileObjectSyncEvent(fileObjectChanges, "sync"));
                    }

                    // Handle Value name changes (delete old Vendor/FileType folders)
                    // Run in a new transaction since afterCommit runs outside transaction context
                    if (!valueNameChanges.isEmpty()) {
                        try {
                            transactionTemplate.executeWithoutResult(status -> {
                                handleValueNameChangesForFileStructure(valueNameChanges);
                            });
                        } catch (Exception e) {
                            log.error("Value name change transaction failed: {}", e.getMessage(), e);
                        }
                    }

                    // Merge duplicate Categories and Values created by independent clients
                    // Called directly — @Transactional on the service method handles the transaction
                    try {
                        categoryValueMergeService.mergeIfDuplicatesExist();
                    } catch (Exception e) {
                        log.error("Category/Value merge failed: {}", e.getMessage(), e);
                    }

                    // Merge duplicate WorkRequests created by independent SharePoint pulls
                    try {
                        workRequestMergeService.mergeIfDuplicatesExist();
                    } catch (Exception e) {
                        log.error("WorkRequest merge failed: {}", e.getMessage(), e);
                    }

                    // Merge duplicate JHAs created by independent SharePoint pulls
                    try {
                        jhaMergeService.mergeIfDuplicatesExist();
                    } catch (Exception e) {
                        log.error("JHA merge failed: {}", e.getMessage(), e);
                    }

                    // Merge duplicate EmailCorrespondence created by independent inbox polls
                    try {
                        emailCorrespondenceMergeService.mergeIfDuplicatesExist();
                    } catch (Exception e) {
                        log.error("EmailCorrespondence merge failed: {}", e.getMessage(), e);
                    }
                }
            });
        } else {
            // No active transaction synchronization, broadcast immediately (fallback)
            pendingBroadcasts.forEach(Runnable::run);

            // Publish FileObject sync event
            if (!fileObjectChanges.isEmpty()) {
                eventPublisher.publishEvent(
                    new FileObjectSyncHandler.FileObjectSyncEvent(fileObjectChanges, "sync"));
            }

            // Handle Value name changes (delete old Vendor/FileType folders)
            if (!valueNameChanges.isEmpty()) {
                handleValueNameChangesForFileStructure(valueNameChanges);
            }

            // Merge duplicate Categories and Values created by independent clients
            try {
                categoryValueMergeService.mergeIfDuplicatesExist();
            } catch (Exception e) {
                log.error("Category/Value merge failed: {}", e.getMessage(), e);
            }

            // Merge duplicate WorkRequests created by independent SharePoint pulls
            try {
                workRequestMergeService.mergeIfDuplicatesExist();
            } catch (Exception e) {
                log.error("WorkRequest merge failed: {}", e.getMessage(), e);
            }

            // Merge duplicate JHAs created by independent SharePoint pulls
            try {
                jhaMergeService.mergeIfDuplicatesExist();
            } catch (Exception e) {
                log.error("JHA merge failed: {}", e.getMessage(), e);
            }
        }

        return totalApplied;
    }

    /**
     * Handle Value name changes that affect file structure.
     * When a Vendor or FileType name changes:
     * 1. Find all FileObjects that reference this Value
     * 2. Queue file downloads for each (files will download to NEW path based on new name)
     * 3. Delete old folders (files are at old path, new files will be downloaded)
     *
     * This is necessary because when Vendor/FileType name changes, no FileObject field changes
     * are generated, so the normal file sync doesn't trigger. But the files on the sync server
     * are already at the new path (uploaded from source machine after rename).
     */
    private void handleValueNameChangesForFileStructure(List<FieldChange> valueNameChanges) {
        if (valueNameChanges.isEmpty()) {
            return;
        }

        for (FieldChange change : valueNameChanges) {
            try {
                // Look up the Value entity to get its category
                // Use EntityManager.find() to bypass @Where(clause = "deleted = false")
                Value value = entityManager.find(Value.class, change.getEntityId());

                if (value == null || value.getCategory() == null) {
                    continue;
                }

                String categoryName = value.getCategory().getName();
                if ("Vendor".equals(categoryName) || "File Type".equals(categoryName)) {
                    String oldName = change.getOldValue().replace("\"", "");

                    // Find all FileObjects that reference this Value
                    // Use queries with fetch joins to ensure vendor and fileType are eagerly loaded
                    List<FileObject> affectedFiles;
                    if ("Vendor".equals(categoryName)) {
                        affectedFiles = fileRepo.findByVendorWithRelationships(value);
                    } else {
                        affectedFiles = fileRepo.findByFileTypeWithRelationships(value);
                    }

                    log.info("{} name change '{}' -> '{}': queueing downloads for {} files",
                        categoryName, oldName, value.getName(), affectedFiles.size());

                    // Queue file downloads for each affected FileObject
                    // Files on sync server are at NEW path, local files are at OLD path
                    // Download will get files to new location
                    // OLD folders will be deleted AFTER download completes (not immediately!)
                    for (FileObject fileObject : affectedFiles) {
                        try {
                            // Build old folder paths for this FileObject (to delete after download)
                            String oldFolderPaths = buildOldFolderPaths(fileObject, oldName, categoryName);
                            fileObjectSyncHandler.queueFileDownloadWithCleanup(fileObject, oldFolderPaths);
                        } catch (Exception e) {
                            log.warn("Failed to queue download for FileObject #{}: {}",
                                fileObject.getId(), e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error handling Value name change for file structure: {}", e.getMessage(), e);
            }
        }
    }

    /**
     * Build old folder paths for a FileObject based on the old Vendor/FileType name.
     * Returns semicolon-separated paths for each extension the FileObject has.
     *
     * File structure: uploads/{extension}/{fileType}/{vendor}/
     * - When Vendor changes: old folder is uploads/{ext}/{fileType}/{oldVendorName}/
     * - When FileType changes: old folder is uploads/{ext}/{oldFileTypeName}/{vendor}/
     */
    private String buildOldFolderPaths(FileObject fileObject, String oldName, String categoryName) {
        List<String> extensions = fileObject.getExtensionsArray();
        if (extensions == null || extensions.isEmpty()) {
            return "";
        }

        List<String> oldPaths = new ArrayList<>();
        String baseLink = fileObject.getBaseLink() != null ? fileObject.getBaseLink() : "uploads";

        for (String ext : extensions) {
            String trimmedExt = ext.trim();
            if (trimmedExt.isEmpty()) continue;

            String oldFolderPath;
            if ("Vendor".equals(categoryName)) {
                // Vendor name changed - build path with old vendor name
                String fileTypeName = fileObject.getFileType() != null ? fileObject.getFileType().getName() : "";
                oldFolderPath = baseLink + "/" + trimmedExt + "/" + fileTypeName + "/" + oldName;
            } else {
                // FileType name changed - build path with old file type name
                String vendorName = fileObject.getVendor() != null ? fileObject.getVendor().getName() : "";
                oldFolderPath = baseLink + "/" + trimmedExt + "/" + oldName + "/" + vendorName;
            }
            oldPaths.add(oldFolderPath);
        }

        return String.join(";", oldPaths);
    }

    /**
     * Batch fetch latest changes for multiple entities of the same type.
     * Returns a map keyed by "entityType:entityId:fieldName".
     */
    private Map<String, FieldChange> batchFetchLatestChanges(String entityType, List<Long> entityIds) {
        if (entityIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<FieldChange> latestChanges = fieldChangeRepository.findLatestChangesForEntities(entityType, entityIds);

        return latestChanges.stream()
            .collect(Collectors.toMap(
                FieldChange::buildChangeKey,
                fc -> fc,
                (a, b) -> a.getTimestamp().isAfter(b.getTimestamp()) ? a : b // Keep newer on conflict
            ));
    }

    /**
     * Apply changes to a single entity using LWW per field with pre-fetched latest changes.
     * This version uses a pre-populated map to avoid N+1 queries.
     *
     * @param failedManyToOneRefs Optional list to collect failed ManyToOne references for retry.
     *                            Pass null to skip collection (e.g., during retry pass).
     */
    @SuppressWarnings("unchecked")
    private int applyEntityChangesBatched(String entityType, Long entityId, List<FieldChange> changes,
                                          Map<String, FieldChange> latestChangesMap,
                                          List<FailedManyToOneReference> failedManyToOneRefs) {
        int appliedCount = 0;

        try {
            SyncableService service = serviceFacade.getService(entityType);
            if (service == null) {
                log.warn("No service found for entity type: {}", entityType);
                return 0;
            }

            // Get current entity
            BaseIdEntity entity = (BaseIdEntity) service.getEntityById(entityId);

            // Check for DELETE changes first
            boolean hasDelete = changes.stream()
                .anyMatch(c -> c.getChangeType() == FieldChange.ChangeType.DELETE
                          && "_entity_".equals(c.getFieldName()));

            if (hasDelete && entity != null) {
                // Apply field changes BEFORE soft delete to preserve data state
                // This ensures the entity has the same field values as the source
                for (FieldChange change : changes) {
                    if (!"_entity_".equals(change.getFieldName()) &&
                        !"deleted".equals(change.getFieldName())) {
                        // Pass null for failedManyToOneRefs - no retry needed for deleted entities
                        applyFieldChange(entity, change, null);
                        saveIncomingChange(change);
                        appliedCount++;
                    }
                }

                // Now apply soft delete
                entity.setDeleted(true);
                service.save(entity);
                saveIncomingChange(changes.stream()
                    .filter(c -> c.getChangeType() == FieldChange.ChangeType.DELETE)
                    .findFirst().orElse(null));
                return appliedCount + 1;
            }

            // Handle entity creation if entity doesn't exist
            if (entity == null) {
                boolean hasCreate = changes.stream()
                    .anyMatch(c -> c.getChangeType() == FieldChange.ChangeType.CREATE
                              && "_entity_".equals(c.getFieldName()));

                if (!hasCreate) {
                    log.debug("Entity {}#{} not found and no CREATE change present, skipping", entityType, entityId);
                    return 0;
                }

                // Create new entity from sync
                entity = createEntityFromSync(entityType, entityId, service);
                if (entity == null) {
                    log.error("Failed to create entity {}#{} from sync", entityType, entityId);
                    return 0;
                }
                log.info("Created new entity {}#{} from sync", entityType, entityId);

                // Save the CREATE change
                saveIncomingChange(changes.stream()
                    .filter(c -> c.getChangeType() == FieldChange.ChangeType.CREATE)
                    .findFirst().orElse(null));
                appliedCount++;
            }

            // Apply field changes using LWW with pre-fetched map
            boolean modified = false;
            for (FieldChange change : changes) {
                if ("_entity_".equals(change.getFieldName())) {
                    continue; // Skip entity-level markers
                }

                // Check if we should apply this change (LWW) using pre-fetched map
                if (shouldApplyChange(change, latestChangesMap)) {
                    boolean applied = applyFieldChange(entity, change, failedManyToOneRefs);
                    if (applied) {
                        modified = true;
                        appliedCount++;
                        saveIncomingChange(change);
                    }
                } else {
                    log.debug("Skipping change for {}.{} - local change is newer or equal",
                        entityType, change.getFieldName());
                }
            }

            if (modified) {
                try {
                    service.save(entity);
                    entityManager.flush(); // Flush per entity to detect issues immediately
                    log.debug("Applied {} changes to {}#{}", appliedCount, entityType, entityId);
                } catch (Exception e) {
                    log.warn("Failed to save {}#{}, skipping: {}", entityType, entityId, e.getMessage());
                    entityManager.clear(); // Reset persistence context after failure
                    return 0;
                }
            }

        } catch (Exception e) {
            log.error("Error applying changes to {}#{}: {}", entityType, entityId, e.getMessage());
        }

        return appliedCount;
    }

    /**
     * Determine if an incoming change should be applied based on Last-Writer-Wins (LWW).
     * Uses pre-fetched map to eliminate N+1 query problem.
     *
     * @param incoming The incoming change to evaluate
     * @param latestChangesMap Pre-fetched map of latest local changes (key: entityType:entityId:fieldName)
     * @return true if the incoming change should be applied
     */
    private boolean shouldApplyChange(FieldChange incoming, Map<String, FieldChange> latestChangesMap) {
        String key = incoming.buildChangeKey();
        FieldChange local = latestChangesMap.get(key);

        if (local == null) {
            return true; // No local change exists, apply incoming
        }

        // If incoming is newer, apply it
        if (incoming.getTimestamp().isAfter(local.getTimestamp())) {
            return true;
        }

        // If timestamps are equal, use machine ID as tiebreaker (deterministic)
        if (incoming.getTimestamp().equals(local.getTimestamp())) {
            return incoming.getOriginMachineId().compareTo(local.getOriginMachineId()) > 0;
        }

        return false; // Local is newer
    }

    /**
     * Apply a single field change to an entity.
     *
     * @param entity The entity to apply the change to
     * @param change The field change to apply
     * @param failedManyToOneRefs Optional list to collect failed ManyToOne references for retry.
     *                            Pass null to skip collection (e.g., during retry pass).
     * @return true if the change was applied successfully
     */
    private boolean applyFieldChange(BaseIdEntity entity, FieldChange change,
                                     List<FailedManyToOneReference> failedManyToOneRefs) {
        try {
            Field field = findField(entity.getClass(), change.getFieldName());
            if (field == null) {
                log.warn("Field not found: {}.{}", entity.getClass().getSimpleName(), change.getFieldName());
                return false;
            }

            // Skip OneToMany collections with mappedBy - these are non-owning side relationships
            // that should be managed by the child entity's ManyToOne field, not synced directly.
            // This prevents deserialization errors and maintains referential integrity.
            if ("OneToMany".equals(change.getRelationshipType())) {
                log.debug("Skipping OneToMany field {}.{} - managed by child entity",
                    entity.getClass().getSimpleName(), change.getFieldName());
                return false;
            }

            // Handle ManyToMany relationships via direct join table manipulation.
            // We cannot use JPA collections because cascade behavior causes issues when
            // referenced entities exist but aren't in the current persistence context.
            if ("ManyToMany".equals(change.getRelationshipType())) {
                return applyManyToManyChange(entity, field, change);
            }

            field.setAccessible(true);

            // For ManyToOne relationships, check if referenced entity exists
            if ("ManyToOne".equals(change.getRelationshipType()) && change.getNewValue() != null
                    && !"null".equals(change.getNewValue())) {
                String cleanedJson = change.getNewValue().replace("\"", "").trim();
                if (!cleanedJson.isEmpty()) {
                    try {
                        Long referencedId = Long.parseLong(cleanedJson);
                        Object referencedEntity = entityManager.find(field.getType(), referencedId);

                        if (referencedEntity != null) {
                            field.set(entity, referencedEntity);
                            return true;
                        } else {
                            // Referenced entity not found - collect for retry if list provided
                            if (failedManyToOneRefs != null) {
                                failedManyToOneRefs.add(new FailedManyToOneReference(entity, change, field, referencedId));
                                log.debug("ManyToOne reference {}#{} not found yet - queued for retry",
                                    field.getType().getSimpleName(), referencedId);
                            } else {
                                log.debug("Related entity {}#{} not found - will resolve in next sync",
                                    field.getType().getSimpleName(), referencedId);
                            }
                            return false;
                        }
                    } catch (NumberFormatException e) {
                        log.warn("Could not parse relationship ID from '{}' for type {}",
                            change.getNewValue(), field.getType().getSimpleName());
                        return false;
                    }
                }
            }

            Object value = deserializeValue(change.getNewValue(), field.getType(), change.getRelationshipType());

            // Only set if deserialization succeeded (null is valid for clearing)
            if (change.getNewValue() == null || value != null || "null".equals(change.getNewValue())) {
                field.set(entity, value);
                return true;
            }

            return false;
        } catch (Exception e) {
            log.error("Error applying field change {}: {}", change.getFieldName(), e.getMessage());
            return false;
        }
    }

    /**
     * Apply a ManyToMany relationship change by directly manipulating the join table.
     * This avoids cascade issues that occur when using JPA collections.
     *
     * IMPORTANT: Before inserting into the join table, we verify that each referenced
     * entity actually exists in the target table. This prevents FK constraint violations
     * when SSE broadcasts split entities across multiple batches - the ManyToMany pass
     * might reference entities that haven't been received yet. Without this check,
     * FK violations mark the Hibernate transaction as rollback-only, which causes
     * ALL entities in the batch to be lost (not just the failed ManyToMany insert).
     *
     * @param entity the entity being updated
     * @param field the ManyToMany field
     * @param change the field change containing the new value (list of IDs)
     * @return true if applied successfully
     */
    private boolean applyManyToManyChange(BaseIdEntity entity, Field field, FieldChange change) {
        try {
            // Get the @JoinTable annotation to find the join table name and column names
            jakarta.persistence.JoinTable joinTable = field.getAnnotation(jakarta.persistence.JoinTable.class);
            if (joinTable == null) {
                // This is the inverse side (mappedBy), skip it - owning side will handle
                log.debug("Skipping ManyToMany inverse side {}.{}",
                    entity.getClass().getSimpleName(), change.getFieldName());
                return false;
            }

            String tableName = joinTable.name();
            String ownerColumn = joinTable.joinColumns()[0].name();
            String inverseColumn = joinTable.inverseJoinColumns()[0].name();

            Long ownerId = entity.getId();

            // Parse the new value - should be a JSON array of IDs like [123, 456]
            String json = change.getNewValue();
            List<Long> newIds = new ArrayList<>();

            if (json != null && !json.isEmpty() && !"null".equals(json) && !"[]".equals(json)) {
                // Parse JSON array of IDs
                json = json.trim();
                if (json.startsWith("[") && json.endsWith("]")) {
                    json = json.substring(1, json.length() - 1);
                    if (!json.isEmpty()) {
                        for (String idStr : json.split(",")) {
                            idStr = idStr.trim().replace("\"", "");
                            if (!idStr.isEmpty()) {
                                newIds.add(Long.parseLong(idStr));
                            }
                        }
                    }
                }
            }

            // Delete existing entries for this entity
            entityManager.createNativeQuery(
                "DELETE FROM " + tableName + " WHERE " + ownerColumn + " = :ownerId")
                .setParameter("ownerId", ownerId)
                .executeUpdate();

            // Filter newIds to only include entities that actually exist in the target table.
            // This prevents FK constraint violations when referenced entities haven't been
            // received yet (e.g., they're in the next SSE batch).
            List<Long> existingIds = filterExistingIds(field, newIds);

            if (existingIds.size() < newIds.size()) {
                log.warn("ManyToMany {}.{}: {} of {} referenced entities not found yet, skipping those",
                    entity.getClass().getSimpleName(), change.getFieldName(),
                    newIds.size() - existingIds.size(), newIds.size());
            }

            // Insert only entries that reference existing entities
            for (Long relatedId : existingIds) {
                entityManager.createNativeQuery(
                    "INSERT INTO " + tableName + " (" + ownerColumn + ", " + inverseColumn + ") VALUES (:ownerId, :relatedId)")
                    .setParameter("ownerId", ownerId)
                    .setParameter("relatedId", relatedId)
                    .executeUpdate();
            }

            log.debug("Applied ManyToMany {}.{}: {} entries in join table {} ({} requested)",
                entity.getClass().getSimpleName(), change.getFieldName(),
                existingIds.size(), tableName, newIds.size());

            // Only return true (which triggers saveIncomingChange) if ALL referenced entities
            // were found. If some were filtered out, return false so this change is NOT recorded
            // in the local FieldChange log. This allows the periodic sync to retry and apply
            // the complete ManyToMany relationship once all entities exist.
            // Without this, saveIncomingChange creates a local record that causes shouldApplyChange()
            // to skip the incoming change during periodic sync ("local change is newer or equal").
            if (existingIds.size() < newIds.size()) {
                log.info("ManyToMany {}.{}: incomplete apply ({}/{} entities), NOT saving change record - periodic sync will retry",
                    entity.getClass().getSimpleName(), change.getFieldName(), existingIds.size(), newIds.size());
                return false;
            }
            return true;

        } catch (Exception e) {
            log.error("Error applying ManyToMany change {}.{}: {}",
                entity.getClass().getSimpleName(), change.getFieldName(), e.getMessage());
            return false;
        }
    }

    /**
     * Filter a list of entity IDs to only include those that exist in the target table.
     * Uses the field's generic type parameter to determine the target entity type,
     * then queries the target table to check existence.
     *
     * @param field the ManyToMany collection field (e.g., Set<FileObject>)
     * @param ids the IDs to check
     * @return list of IDs that exist in the target table
     */
    @SuppressWarnings("unchecked")
    private List<Long> filterExistingIds(Field field, List<Long> ids) {
        if (ids.isEmpty()) {
            return ids;
        }

        // Resolve target entity type from collection's generic type parameter
        Class<?> targetType = resolveCollectionElementType(field);
        if (targetType == null) {
            log.warn("Could not resolve target type for ManyToMany field {}, inserting without existence check",
                field.getName());
            return ids;
        }

        String targetTable = entityTableRegistry.getTableName(targetType.getSimpleName());
        if (targetTable == null) {
            log.warn("No table mapping for {}, inserting without existence check", targetType.getSimpleName());
            return ids;
        }

        // Batch query to find which IDs exist
        List<?> foundRows = entityManager.createNativeQuery(
            "SELECT id FROM " + targetTable + " WHERE id IN :ids")
            .setParameter("ids", ids)
            .getResultList();

        Set<Long> foundIds = foundRows.stream()
            .map(o -> ((Number) o).longValue())
            .collect(Collectors.toSet());

        return ids.stream()
            .filter(foundIds::contains)
            .collect(Collectors.toList());
    }

    /**
     * Resolve the element type of a collection field's generic type parameter.
     * For example, Set<FileObject> returns FileObject.class.
     */
    private Class<?> resolveCollectionElementType(Field field) {
        java.lang.reflect.Type genericType = field.getGenericType();
        if (genericType instanceof java.lang.reflect.ParameterizedType) {
            java.lang.reflect.ParameterizedType pt = (java.lang.reflect.ParameterizedType) genericType;
            java.lang.reflect.Type[] typeArgs = pt.getActualTypeArguments();
            if (typeArgs.length > 0 && typeArgs[0] instanceof Class) {
                return (Class<?>) typeArgs[0];
            }
        }
        return null;
    }

    /**
     * Create a new entity from sync with the specified ID.
     *
     * Uses native SQL INSERT to directly create the entity with the target ID,
     * avoiding the ID generator entirely. This prevents ID collisions when multiple
     * entities are created in the same sync batch.
     *
     * Queries INFORMATION_SCHEMA to discover NOT NULL columns beyond the base set
     * and includes default values for them. This handles stale NOT NULL constraints
     * left in the database by ddl-auto=update (which never drops constraints).
     */
    @SuppressWarnings("unchecked")
    private BaseIdEntity createEntityFromSync(String entityType, Long entityId, SyncableService service) {
        try {
            // First check if entity already exists (might have been created earlier in this batch
            // or in a previous sync)
            BaseIdEntity existing = (BaseIdEntity) service.getEntityById(entityId);
            if (existing != null) {
                log.debug("Entity {}#{} already exists, returning existing", entityType, entityId);
                return existing;
            }

            // Get the table name for native SQL
            String tableName = getTableName(entityType);

            // Check for soft-deleted entities: @Where(clause = "deleted = false") makes them
            // invisible to JPA, but the row still exists with deleted=true.
            // If found, un-delete the row instead of trying to INSERT (which would cause PK violation).
            Long existingCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM " + tableName + " WHERE id = :id")
                .setParameter("id", entityId)
                .getSingleResult()).longValue();

            if (existingCount > 0) {
                entityManager.createNativeQuery(
                    "UPDATE " + tableName + " SET deleted = false, date_modified = :now WHERE id = :id")
                    .setParameter("id", entityId)
                    .setParameter("now", java.time.LocalDateTime.now())
                    .executeUpdate();
                entityManager.flush();
                entityManager.clear();

                BaseIdEntity reactivated = (BaseIdEntity) service.getEntityById(entityId);
                if (reactivated != null) {
                    log.debug("Entity {}#{} was soft-deleted, re-activated", entityType, entityId);
                    return reactivated;
                }
            }

            // Query NOT NULL columns beyond the base set so we can provide defaults.
            // ddl-auto=update never removes NOT NULL constraints, so the DB may have
            // stale constraints even if the Java annotations were removed.
            List<Object[]> notNullCols = entityManager.createNativeQuery(
                "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS " +
                "WHERE TABLE_NAME = :tableName AND IS_NULLABLE = 'NO' " +
                "AND COLUMN_NAME NOT IN ('ID', 'OBJECT_TYPE', 'DELETED', 'DATE_CREATED', 'DATE_MODIFIED')")
                .setParameter("tableName", tableName.toUpperCase())
                .getResultList();

            // Build dynamic INSERT including defaults for NOT NULL columns
            StringBuilder columns = new StringBuilder("id, object_type, deleted, date_created, date_modified");
            StringBuilder values = new StringBuilder(":id, :objectType, false, :now, :now");

            for (Object[] col : notNullCols) {
                String colName = ((String) col[0]).toLowerCase();
                String typeName = ((String) col[1]).toUpperCase();
                // Skip VARCHAR/CHAR/CLOB columns — they were made nullable at startup by
                // SyncSchemaPreparation. This avoids CHECK constraint violations on enum
                // columns (e.g., EmailCorrespondence.direction). Real values are set
                // immediately after by applyFieldChange() calls.
                if (typeName.contains("VARCHAR") || typeName.contains("CHAR")
                        || typeName.contains("CLOB") || typeName.contains("TEXT")
                        || typeName.contains("CHARACTER")) {
                    continue;
                }
                columns.append(", ").append(colName);
                values.append(", ").append(defaultValueForType(typeName));
            }

            int inserted = entityManager.createNativeQuery(
                "INSERT INTO " + tableName + " (" + columns + ") VALUES (" + values + ")")
                .setParameter("id", entityId)
                .setParameter("objectType", entityType)
                .setParameter("now", java.time.LocalDateTime.now())
                .executeUpdate();

            if (inserted == 0) {
                log.error("Failed to insert entity {}#{} via native SQL", entityType, entityId);
                return null;
            }

            entityManager.flush();
            entityManager.clear(); // Clear cache to load the newly inserted entity

            // Load the entity via JPA for further operations
            BaseIdEntity newEntity = (BaseIdEntity) service.getEntityById(entityId);

            if (newEntity == null) {
                log.error("Entity {}#{} was inserted but could not be loaded", entityType, entityId);
                return null;
            }

            log.debug("Created entity {}#{} via direct INSERT", entityType, entityId);
            return newEntity;

        } catch (Exception e) {
            log.error("Failed to create entity {} with ID {}: {}", entityType, entityId, e.getMessage(), e);
            log.error("Failed to create entity {}#{} from sync", entityType, entityId);
            return null;
        }
    }

    /** Return an SQL literal default value appropriate for the given H2 column type. */
    private String defaultValueForType(String typeName) {
        if (typeName.contains("BOOLEAN")) return "false";
        if (typeName.contains("INT") || typeName.contains("DOUBLE") || typeName.contains("FLOAT")
                || typeName.contains("DECIMAL") || typeName.contains("NUMERIC")) return "0";
        if (typeName.contains("DATE") || typeName.contains("TIMESTAMP")) return "CURRENT_TIMESTAMP";
        return "''"; // VARCHAR, CHAR, CLOB, TEXT, etc.
    }

    /**
     * Save an incoming change to our log (mark as synced to us and to server)
     */
    private void saveIncomingChange(FieldChange change) {
        if (change == null) return;

        // Check if we already have this exact change
        boolean exists = fieldChangeRepository.existsByEntityTypeAndEntityIdAndFieldNameAndTimestampAndOriginMachineId(
            change.getEntityType(), change.getEntityId(), change.getFieldName(),
            change.getTimestamp(), change.getOriginMachineId());

        if (!exists) {
            // Create a NEW entity to avoid Hibernate persistence context conflicts.
            // The incoming 'change' may be a managed entity (e.g., when called from
            // HubSyncService.syncExchange with already-saved changes), and mutating its
            // ID with setId(null) causes "identifier was altered" errors at flush time.
            FieldChange newChange = new FieldChange();
            newChange.setEntityType(change.getEntityType());
            newChange.setEntityId(change.getEntityId());
            newChange.setFieldName(change.getFieldName());
            newChange.setOldValue(change.getOldValue());
            newChange.setNewValue(change.getNewValue());
            newChange.setTimestamp(change.getTimestamp());
            newChange.setOriginMachineId(change.getOriginMachineId());
            newChange.setOriginMachineName(change.getOriginMachineName());
            newChange.setChangeType(change.getChangeType());
            newChange.setRelationshipType(change.getRelationshipType());
            newChange.setReceivedAt(Instant.now());
            newChange.addSyncedMachine(syncConfig.getMachineId());
            // Also mark as synced to SERVER since this change came FROM the server
            // This prevents the change from being sent back to the server in the next periodic sync
            newChange.addSyncedMachine("SERVER");
            fieldChangeRepository.save(newChange);
        }
    }

    /**
     * Deserialize a value from JSON string.
     *
     * IMPORTANT: For relationship references, this method uses EntityManager.find() directly
     * instead of the repository's findById(). This bypasses the @Where(clause = "deleted = false")
     * filter that would otherwise prevent finding soft-deleted entities.
     *
     * This is critical for sync because:
     * 1. When an entity (e.g., Vendor) is deleted, its 'deleted' flag is set to true
     * 2. Other entities (e.g., FileObject) may still reference the deleted Vendor
     * 3. When syncing, we need to preserve these references even to deleted entities
     * 4. Using repository.findById() would return null for deleted entities, breaking the relationship
     */
    @SuppressWarnings("unchecked")
    private Object deserializeValue(String json, Class<?> targetType, String relationshipType) {
        if (json == null || "null".equals(json)) return null;

        try {
            // Handle relationship references - fetch referenced entity by ID
            if (relationshipType != null && BaseIdEntity.class.isAssignableFrom(targetType)) {
                // Parse entity ID from JSON and load the referenced entity
                String cleanedJson = json.replace("\"", "").trim();
                if (cleanedJson.isEmpty() || "null".equals(cleanedJson)) {
                    return null; // Relationship cleared
                }

                try {
                    Long relatedId = Long.parseLong(cleanedJson);

                    // Use find() to get the actual entity from the database.
                    // We cannot use getReference() because it may return a proxy that hasn't been
                    // properly associated with the current persistence context, causing cascade issues.
                    Object relatedEntity = entityManager.find(targetType, relatedId);

                    if (relatedEntity != null) {
                        // Validate that we got an actual entity, not just the ID
                        if (relatedEntity instanceof BaseIdEntity) {
                            log.debug("Resolved relationship {} -> entity #{} (using EntityManager.find)",
                                targetType.getSimpleName(), relatedId);
                            return relatedEntity;
                        } else {
                            log.error("EntityManager.find returned non-entity for {}#{}: {}",
                                targetType.getSimpleName(), relatedId, relatedEntity.getClass().getName());
                            return null;
                        }
                    } else {
                        // Entity not found - this can happen if the referenced entity hasn't been
                        // synced yet (ordering issue). Skip this field for now.
                        log.warn("Related entity {}#{} not found - may not be synced yet",
                            targetType.getSimpleName(), relatedId);
                        return null;
                    }
                } catch (NumberFormatException e) {
                    log.warn("Could not parse relationship ID from '{}' for type {}", json, targetType.getSimpleName());
                    return null;
                }
            }

            // Handle primitives and wrappers
            if (targetType == String.class) {
                // Remove surrounding quotes if present
                if (json.startsWith("\"") && json.endsWith("\"")) {
                    return json.substring(1, json.length() - 1);
                }
                return json;
            }
            if (targetType == Long.class || targetType == long.class) {
                return Long.parseLong(json.replace("\"", ""));
            }
            if (targetType == Integer.class || targetType == int.class) {
                return Integer.parseInt(json.replace("\"", ""));
            }
            if (targetType == Double.class || targetType == double.class) {
                return Double.parseDouble(json.replace("\"", ""));
            }
            if (targetType == Boolean.class || targetType == boolean.class) {
                return Boolean.parseBoolean(json.replace("\"", ""));
            }

            // Handle enums
            if (targetType.isEnum()) {
                String enumValue = json.replace("\"", "");
                return Enum.valueOf((Class<Enum>) targetType, enumValue);
            }

            // Handle complex types via Jackson
            return objectMapper.readValue(json, targetType);

        } catch (Exception e) {
            log.warn("Error deserializing value '{}' to type {}: {}",
                truncate(json), targetType.getSimpleName(), e.getMessage());
            return null;
        }
    }

    /**
     * Find a field by name, including inherited fields
     */
    private Field findField(Class<?> clazz, String fieldName) {
        while (clazz != null && clazz != Object.class) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        return null;
    }

    /**
     * Get the database table name for an entity type.
     * Delegates to EntityTableRegistry for centralized mapping.
     */
    private String getTableName(String entityType) {
        return entityTableRegistry.getTableName(entityType);
    }

    /**
     * Receive and process changes from a peer, return our pending changes
     */
    @Transactional
    public List<FieldChange> receiveChangesAndRespond(String fromMachineId, String fromMachineName,
                                                       List<FieldChange> incomingChanges) {
        // Apply incoming changes
        if (incomingChanges != null && !incomingChanges.isEmpty()) {
            log.info("Received {} changes from {} ({})", incomingChanges.size(), fromMachineName, fromMachineId);
            applyIncomingChanges(incomingChanges);
        }

        // Return our pending changes for that peer
        return getPendingChangesFor(fromMachineId);
    }

    /**
     * Get pending changes for a specific peer
     */
    public List<FieldChange> getPendingChangesFor(String machineId) {
        return fieldChangeRepository.findChangesNotSyncedTo(machineId);
    }

    /**
     * Get total change count
     */
    public long getTotalChangeCount() {
        return fieldChangeRepository.count();
    }

    /**
     * Cleanup old changes based on retention policy
     */
    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
    @Transactional
    public void cleanupOldChanges() {
        Instant cutoff = Instant.now().minusSeconds(syncConfig.getRetentionDays() * 24L * 60 * 60);
        int deleted = fieldChangeRepository.deleteChangesBefore(cutoff);
        if (deleted > 0) {
            log.info("Cleaned up {} old field changes (older than {} days)",
                deleted, syncConfig.getRetentionDays());
        }
    }

    private String truncate(String s) {
        if (s == null) return "null";
        return s.length() > 50 ? s.substring(0, 47) + "..." : s;
    }

    /**
     * Tracks a ManyToOne field change that failed because the referenced entity wasn't found.
     * Used for retry in the third pass after all entities are created.
     */
    private static class FailedManyToOneReference {
        final BaseIdEntity entity;
        final FieldChange change;
        final Field field;
        final Long referencedId;

        FailedManyToOneReference(BaseIdEntity entity, FieldChange change, Field field, Long referencedId) {
            this.entity = entity;
            this.change = change;
            this.field = field;
            this.referencedId = referencedId;
        }
    }

    /**
     * Result of a sync operation
     */
    public static class SyncResult {
        private boolean success;
        private int changesSent;
        private int changesReceived;
        private int changesApplied;
        private String errorMessage;

        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public int getChangesSent() { return changesSent; }
        public void setChangesSent(int changesSent) { this.changesSent = changesSent; }
        public int getChangesReceived() { return changesReceived; }
        public void setChangesReceived(int changesReceived) { this.changesReceived = changesReceived; }
        public int getChangesApplied() { return changesApplied; }
        public void setChangesApplied(int changesApplied) { this.changesApplied = changesApplied; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
}
