package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.sync.SyncUpdateController;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.Peer;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
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
            PlatformTransactionManager transactionManager) {
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
    }

    /**
     * Sync with all known peers on application startup.
     * Only runs if server sync is disabled (peer-to-peer mode).
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
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
        if (syncConfig.isServerSyncEnabled()) {
            return; // Server sync handles this
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
        } finally {
            syncContext.endSync();
        }
    }

    /**
     * Internal method that actually applies the changes.
     * Uses batch queries for conflict resolution to eliminate N+1 query problem.
     */
    private int applyIncomingChangesInternal(List<FieldChange> incomingChanges) {
        // Group changes by entity type first
        Map<String, Map<Long, List<FieldChange>>> changesByEntity = incomingChanges.stream()
            .collect(Collectors.groupingBy(
                FieldChange::getEntityType,
                Collectors.groupingBy(FieldChange::getEntityId)
            ));

        int totalApplied = 0;

        // Collect broadcasts to send AFTER transaction commits
        List<Runnable> pendingBroadcasts = new ArrayList<>();

        // Process each entity type with batch conflict resolution
        for (Map.Entry<String, Map<Long, List<FieldChange>>> entityEntry : changesByEntity.entrySet()) {
            String entityType = entityEntry.getKey();
            Map<Long, List<FieldChange>> changesById = entityEntry.getValue();

            // Batch fetch latest changes for all entities of this type (eliminates N+1)
            List<Long> entityIds = new ArrayList<>(changesById.keySet());
            Map<String, FieldChange> latestChangesMap = batchFetchLatestChanges(entityType, entityIds);

            for (Map.Entry<Long, List<FieldChange>> idEntry : changesById.entrySet()) {
                Long entityId = idEntry.getKey();
                List<FieldChange> changes = idEntry.getValue();

                int applied = applyEntityChangesBatched(entityType, entityId, changes, latestChangesMap);
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

        // Collect FileObject changes for file sync
        List<FieldChange> fileObjectChanges = incomingChanges.stream()
            .filter(c -> "FileObject".equals(c.getEntityType()))
            .toList();

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
        }

        return totalApplied;
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
                fc -> fc.getEntityType() + ":" + fc.getEntityId() + ":" + fc.getFieldName(),
                fc -> fc,
                (a, b) -> a.getTimestamp().isAfter(b.getTimestamp()) ? a : b // Keep newer on conflict
            ));
    }

    /**
     * Apply changes to a single entity using LWW per field with pre-fetched latest changes.
     * This version uses a pre-populated map to avoid N+1 queries.
     */
    @SuppressWarnings("unchecked")
    private int applyEntityChangesBatched(String entityType, Long entityId, List<FieldChange> changes,
                                          Map<String, FieldChange> latestChangesMap) {
        int appliedCount = 0;

        try {
            CrudService service = serviceFacade.getService(entityType);
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
                // Apply soft delete
                entity.setDeleted(true);
                service.getRepo().save(entity);
                saveIncomingChange(changes.stream()
                    .filter(c -> c.getChangeType() == FieldChange.ChangeType.DELETE)
                    .findFirst().orElse(null));
                return 1;
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
                if (shouldApplyChangeBatched(change, latestChangesMap)) {
                    boolean applied = applyFieldChange(entity, change);
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
                service.getRepo().save(entity);
                log.debug("Applied {} changes to {}#{}", appliedCount, entityType, entityId);
            }

        } catch (Exception e) {
            log.error("Error applying changes to {}#{}: {}", entityType, entityId, e.getMessage());
        }

        return appliedCount;
    }

    /**
     * Determine if an incoming change should be applied based on LWW using pre-fetched map.
     * This eliminates the N+1 query problem by using batch-loaded data.
     */
    private boolean shouldApplyChangeBatched(FieldChange incoming, Map<String, FieldChange> latestChangesMap) {
        String key = incoming.getEntityType() + ":" + incoming.getEntityId() + ":" + incoming.getFieldName();
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
     * Determine if an incoming change should be applied based on LWW.
     * Legacy method - use shouldApplyChangeBatched for batch operations.
     */
    private boolean shouldApplyChange(FieldChange incoming) {
        Optional<FieldChange> localChange = fieldChangeRepository.findLatestChange(
            incoming.getEntityType(), incoming.getEntityId(), incoming.getFieldName());

        if (localChange.isEmpty()) {
            return true; // No local change exists, apply incoming
        }

        FieldChange local = localChange.get();

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
     * Apply a single field change to an entity
     */
    private boolean applyFieldChange(BaseIdEntity entity, FieldChange change) {
        try {
            Field field = findField(entity.getClass(), change.getFieldName());
            if (field == null) {
                log.warn("Field not found: {}.{}", entity.getClass().getSimpleName(), change.getFieldName());
                return false;
            }

            field.setAccessible(true);
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
     * Create a new entity from sync with the specified ID.
     * Uses reflection to create instance and set ID via native SQL to preserve the ID from origin.
     */
    @SuppressWarnings("unchecked")
    private BaseIdEntity createEntityFromSync(String entityType, Long entityId, CrudService service) {
        try {
            // Get the entity class from service
            BaseIdEntity templateEntity = (BaseIdEntity) service.getEntity();
            Class<?> entityClass = templateEntity.getClass();

            // Create new instance
            BaseIdEntity newEntity = (BaseIdEntity) entityClass.getDeclaredConstructor().newInstance();

            // We need to save with the specific ID from the source system
            // This requires using native SQL or a special repository method
            // For now, we'll set the ID and use saveAndFlush with GenerationType.IDENTITY workaround

            // First save without ID to get a placeholder
            newEntity = (BaseIdEntity) service.getRepo().saveAndFlush(newEntity);

            // Now update to the correct ID using native query if IDs don't match
            if (!entityId.equals(newEntity.getId())) {
                // Use the repository to update the ID - this is tricky with JPA
                // We need to delete and re-insert, or use native SQL
                Long tempId = newEntity.getId();

                // For now, we'll use a workaround: update all references
                // This assumes the entity was just created and has no relationships yet
                try {
                    // Determine table name - handle common cases
                    String tableName;
                    if ("FileObject".equals(entityType)) {
                        tableName = "file_object";
                    } else {
                        // Convert CamelCase to snake_case
                        tableName = entityType.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
                    }

                    // Use EntityManager to execute native query (works with Spring's transaction management)
                    int updated = entityManager.createNativeQuery(
                        "UPDATE " + tableName + " SET id = :newId WHERE id = :oldId")
                        .setParameter("newId", entityId)
                        .setParameter("oldId", tempId)
                        .executeUpdate();

                    if (updated == 0) {
                        log.warn("No rows updated when changing ID from {} to {} for {}", tempId, entityId, entityType);
                    }

                    entityManager.flush();
                    entityManager.clear(); // Clear cache to reload with new ID

                    // Reload entity with correct ID
                    newEntity = (BaseIdEntity) service.getEntityById(entityId);

                    log.debug("Updated entity ID from {} to {} for {}", tempId, entityId, entityType);
                } catch (Exception e) {
                    log.error("Failed to update entity ID for {}#{}: {}", entityType, entityId, e.getMessage());
                    // Rollback - delete the temp entity
                    service.getRepo().deleteById(tempId);
                    return null;
                }
            }

            return newEntity;
        } catch (Exception e) {
            log.error("Failed to create entity {} with ID {}: {}", entityType, entityId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Save an incoming change to our log (mark as synced to us)
     */
    private void saveIncomingChange(FieldChange change) {
        if (change == null) return;

        // Check if we already have this exact change
        boolean exists = fieldChangeRepository.existsByEntityTypeAndEntityIdAndFieldNameAndTimestampAndOriginMachineId(
            change.getEntityType(), change.getEntityId(), change.getFieldName(),
            change.getTimestamp(), change.getOriginMachineId());

        if (!exists) {
            change.addSyncedMachine(syncConfig.getMachineId());
            // Generate new ID for our copy
            change.setId(null);
            fieldChangeRepository.save(change);
        }
    }

    /**
     * Deserialize a value from JSON string
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
                    String targetTypeName = targetType.getSimpleName();
                    CrudService relatedService = serviceFacade.getService(targetTypeName);

                    if (relatedService != null) {
                        Object relatedEntity = relatedService.getEntityById(relatedId);
                        if (relatedEntity != null) {
                            log.debug("Resolved relationship {} -> entity #{}", targetTypeName, relatedId);
                            return relatedEntity;
                        } else {
                            log.warn("Related entity {}#{} not found", targetTypeName, relatedId);
                            return null;
                        }
                    } else {
                        log.warn("No service registered for relationship type: {}", targetTypeName);
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
