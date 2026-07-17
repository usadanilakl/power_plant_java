package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.hibernate.engine.spi.SessionImplementor;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class FieldChangeTracker {

    private final FieldChangeRepository fieldChangeRepository;
    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    private final SyncEventPublisher syncEventPublisher;
    private final SyncContext syncContext;
    // Origin client-id stash — populated by ClientIdRequestFilter from the
    // X-Client-Id header on any Ng REST call. Captured into a local BEFORE
    // registering afterCommit so a stray thread-reuse can't leak a wrong id
    // into a later request (the ThreadLocal is cleared by the filter's finally).
    private final RequestClientIdContext requestClientIdContext;

    // Field-injected (NOT a @RequiredArgsConstructor final field) — used only to unwrap the current
    // transaction's Hibernate session so UPDATE FieldChange rows can be INSERTed on its own JDBC
    // connection. Same acquisition idiom as EntityStateCapture. See persistFieldChangesOnConnection.
    @PersistenceContext
    private EntityManager entityManager;

    // Lazy injection to avoid circular dependency
    private FileObjectSyncHandler fileObjectSyncHandler;

    public void setFileObjectSyncHandler(FileObjectSyncHandler handler) {
        this.fileObjectSyncHandler = handler;
    }

    // Fields to exclude from tracking
    private static final Set<String> EXCLUDED_FIELDS = Set.of(
        "id", // ID is never changed for updates, and Hibernate snapshot doesn't include it
        "version",
        "dateCreated", "dateModified", "objectType", "serialVersionUID",
        "hibernateLazyInitializer", "handler"
    );

    // ==================== FIELD CACHE ====================
    // Static cache for field metadata per entity class to avoid repeated reflection
    private static final ConcurrentHashMap<Class<?>, List<CachedFieldInfo>> FIELD_CACHE = new ConcurrentHashMap<>();

    /**
     * Cached field information including pre-computed tracking metadata.
     * This avoids repeated reflection and annotation checks on every change.
     */
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
            // Make accessible once during caching
            field.setAccessible(true);
        }
    }

    /**
     * Get cached field info for a class. Builds cache on first access.
     */
    private List<CachedFieldInfo> getCachedFields(Class<?> clazz) {
        return FIELD_CACHE.computeIfAbsent(clazz, this::buildFieldCache);
    }

    /**
     * Build the field cache for a class, including all inherited fields.
     */
    private List<CachedFieldInfo> buildFieldCache(Class<?> clazz) {
        List<CachedFieldInfo> cachedFields = new ArrayList<>();
        Set<String> seenFieldNames = new HashSet<>();
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            for (Field field : current.getDeclaredFields()) {
                // Skip shadowed fields — subclass field takes priority (encountered first)
                if (!seenFieldNames.add(field.getName())) continue;
                boolean shouldTrack = computeShouldTrackField(field);
                String relationshipType = computeRelationshipType(field);
                cachedFields.add(new CachedFieldInfo(field, shouldTrack, relationshipType));
            }
            current = current.getSuperclass();
        }
        log.debug("Built field cache for {}: {} fields ({} trackable)",
            clazz.getSimpleName(), cachedFields.size(),
            cachedFields.stream().filter(f -> f.shouldTrack).count());
        return cachedFields;
    }

    /**
     * Compute whether a field should be tracked (called once during cache build).
     */
    private boolean computeShouldTrackField(Field field) {
        String fieldName = field.getName();

        // Skip excluded fields
        if (EXCLUDED_FIELDS.contains(fieldName)) return false;

        // Skip transient fields
        if (field.isAnnotationPresent(Transient.class)) return false;

        // Skip JsonIgnore fields — except ManyToOne FKs which need sync tracking.
        // @JsonIgnore on ManyToOne prevents Jackson/ModelMapper circular traversal,
        // but the tracker only serializes the referenced entity's ID (no lazy load issues).
        if (field.isAnnotationPresent(JsonIgnore.class)
                && !field.isAnnotationPresent(ManyToOne.class)) return false;

        // Skip static fields
        if (Modifier.isStatic(field.getModifiers())) return false;

        // Skip final fields
        if (Modifier.isFinal(field.getModifiers())) return false;

        // Skip OneToMany collections with mappedBy - these are the non-owning side
        if (field.isAnnotationPresent(OneToMany.class)) {
            OneToMany oneToMany = field.getAnnotation(OneToMany.class);
            if (oneToMany.mappedBy() != null && !oneToMany.mappedBy().isEmpty()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Compute the relationship type (called once during cache build).
     */
    private String computeRelationshipType(Field field) {
        if (field.isAnnotationPresent(ManyToOne.class)) return "ManyToOne";
        if (field.isAnnotationPresent(OneToMany.class)) return "OneToMany";
        if (field.isAnnotationPresent(ManyToMany.class)) return "ManyToMany";
        if (field.isAnnotationPresent(OneToOne.class)) return "OneToOne";
        return null;
    }
    // ==================== END FIELD CACHE ====================

    /**
     * Track changes between old and new entity state
     * @return List of field changes that were recorded
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T extends BaseIdEntity> List<FieldChange> trackChanges(T oldEntity, T newEntity) {
        List<FieldChange> changes = new ArrayList<>();

        if (newEntity == null) {
            log.warn("Cannot track changes: newEntity is null");
            return changes;
        }

        // Skip tracking entirely if we're in sync context
        // This prevents creating FieldChange records for entities being modified from sync,
        // which could interfere with the original changes being applied
        if (syncContext.isSyncing()) {
            log.debug("Skipping change tracking - in sync context for {} #{}",
                newEntity.getClass().getSimpleName(), newEntity.getId());
            return changes;
        }

        String entityType = newEntity.getClass().getSimpleName();
        Long entityId = newEntity.getId();

        if (entityId == null) {
            log.warn("Cannot track changes: entity ID is null for {}", entityType);
            return changes;
        }

        try {
            log.debug("trackChanges called for {} #{}, oldEntity={}", entityType, entityId, oldEntity != null ? "present" : "null");

            // Handle create (new entity)
            if (oldEntity == null) {
                changes.addAll(trackEntityCreation(entityType, entityId, newEntity));
            } else {
                // Handle update - compare each field
                changes.addAll(trackEntityUpdate(entityType, entityId, oldEntity, newEntity));
            }

            log.debug("Found {} changes for {} #{}", changes.size(), entityType, entityId);

            // Save all changes and trigger sync
            if (!changes.isEmpty()) {
                fieldChangeRepository.saveAll(changes);
                log.debug("Saved {} field changes for {} #{}", changes.size(), entityType, entityId);

                log.debug("Publishing {} changes for sync broadcast", changes.size());
                // afterCommit (of this REQUIRES_NEW tx), not synchronous pre-commit — see the removed
                // sleep in CentralSyncService.onChangesDetected.
                publishChangesOnCommit(changes);
            }
        } catch (Exception e) {
            log.error("Error tracking changes for {} #{}: {}", entityType, entityId, e.getMessage(), e);
        }

        return changes;
    }

    /**
     * Track entity creation - records all non-null fields
     */
    private <T extends BaseIdEntity> List<FieldChange> trackEntityCreation(String entityType, Long entityId, T newEntity) {
        List<FieldChange> changes = new ArrayList<>();

        // Add entity creation marker
        FieldChange createChange = new FieldChange(
            entityType, entityId, "_entity_",
            null, "CREATED",
            syncConfig.getMachineId(), syncConfig.getMachineName(),
            FieldChange.ChangeType.CREATE
        );
        changes.add(createChange);

        // Track all non-null fields as initial values (using cached field info)
        for (CachedFieldInfo fieldInfo : getCachedFields(newEntity.getClass())) {
            if (fieldInfo.shouldTrack) {
                try {
                    Object newValue = fieldInfo.field.get(newEntity);
                    if (newValue != null) {
                        FieldChange fieldChange = createFieldChange(
                            entityType, entityId, fieldInfo.fieldName,
                            null, newValue,
                            FieldChange.ChangeType.CREATE,
                            fieldInfo.relationshipType
                        );
                        changes.add(fieldChange);
                    }
                } catch (Exception e) {
                    log.warn("Error tracking field {} on create: {}", fieldInfo.fieldName, e.getMessage());
                }
            }
        }

        return changes;
    }

    /**
     * Track entity update - compares old and new values for each field
     */
    private <T extends BaseIdEntity> List<FieldChange> trackEntityUpdate(String entityType, Long entityId, T oldEntity, T newEntity) {
        List<FieldChange> changes = new ArrayList<>();

        log.trace("Comparing fields for {} #{}", entityType, entityId);

        // Use cached field info for better performance
        for (CachedFieldInfo fieldInfo : getCachedFields(newEntity.getClass())) {
            if (fieldInfo.shouldTrack) {
                try {
                    Object oldValue = fieldInfo.field.get(oldEntity);
                    Object newValue = fieldInfo.field.get(newEntity);

                    if (!areValuesEqual(oldValue, newValue)) {
                        // IMPORTANT: Skip false-positive changes where the 'name' field appears to be
                        // "changing" from a value to null. This can happen during cascade updates
                        // (e.g., when Vendor is renamed, FileObject may be marked dirty even though
                        // no FileObject fields actually changed). In such cases, the in-memory entity
                        // might have uninitialized/null fields due to Hibernate proxy behavior.
                        // This is a protective measure - it's unlikely someone intentionally clears a name.
                        if ("name".equals(fieldInfo.fieldName) && oldValue != null && newValue == null) {
                            log.debug("Skipping suspicious 'name' change {}.{}: '{}' -> null " +
                                "(cascade false-positive)",
                                entityType, fieldInfo.fieldName, truncateValue(oldValue));
                            continue;
                        }

                        FieldChange fieldChange = createFieldChange(
                            entityType, entityId, fieldInfo.fieldName,
                            oldValue, newValue,
                            FieldChange.ChangeType.UPDATE,
                            fieldInfo.relationshipType
                        );
                        changes.add(fieldChange);
                        log.debug("Field CHANGED: {}.{} = '{}' -> '{}'", entityType, fieldInfo.fieldName,
                            truncateValue(oldValue), truncateValue(newValue));
                    }
                } catch (Exception e) {
                    log.warn("Error comparing field {}: {}", fieldInfo.fieldName, e.getMessage());
                }
            }
        }

        log.trace("Total changes found: {}", changes.size());
        return changes;
    }

    /**
     * Track entity creation - called from EntityListener
     * Public wrapper that handles saving and broadcasting
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T extends BaseIdEntity> List<FieldChange> trackEntityCreation(T entity) {
        List<FieldChange> changes = new ArrayList<>();

        if (entity == null || entity.getId() == null) {
            log.warn("Cannot track creation: entity or ID is null");
            return changes;
        }

        // Skip tracking entirely if we're in sync context
        // This prevents creating FieldChange records for entities being created from sync,
        // which would have null/default values that could overwrite real values on other machines
        if (syncContext.isSyncing()) {
            log.debug("Skipping entity creation tracking - in sync context for {} #{}",
                entity.getClass().getSimpleName(), entity.getId());
            return changes;
        }

        String entityType = entity.getClass().getSimpleName();
        Long entityId = entity.getId();

        try {
            log.debug("trackEntityCreation called for {} #{}", entityType, entityId);
            changes.addAll(trackEntityCreation(entityType, entityId, entity));

            if (!changes.isEmpty()) {
                fieldChangeRepository.saveAll(changes);
                log.debug("Saved {} field changes for new {} #{}", changes.size(), entityType, entityId);
                // Publish afterCommit (of this REQUIRES_NEW tx) rather than synchronously mid-method,
                // so an SSE/send event never races ahead of the committed rows. isCreate=true keeps
                // the FileObject upload semantics.
                publishOnCommit(changes, entityType, entity, true);
            }
        } catch (Exception e) {
            log.error("Error tracking entity creation for {} #{}: {}", entityType, entityId, e.getMessage(), e);
        }

        return changes;
    }

    /**
     * Ensure an entity has a CREATE marker and full synthetic create history.
     * Used when an existing local row becomes sync-visible later (for example,
     * a WR bound to SharePoint after being created through another ingestion path).
     *
     * This is idempotent: if a CREATE marker already exists, nothing is written.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T extends BaseIdEntity> List<FieldChange> ensureCreateHistoryIfMissing(T entity) {
        List<FieldChange> changes = new ArrayList<>();

        if (entity == null || entity.getId() == null) {
            log.warn("Cannot ensure create history: entity or ID is null");
            return changes;
        }

        if (syncContext.isSyncing()) {
            log.debug("Skipping create-history repair - in sync context for {} #{}",
                entity.getClass().getSimpleName(), entity.getId());
            return changes;
        }

        String entityType = entity.getClass().getSimpleName();
        Long entityId = entity.getId();

        try {
            boolean hasCreateMarker = fieldChangeRepository
                .existsByEntityTypeAndEntityIdAndChangeTypeAndFieldName(
                    entityType, entityId, FieldChange.ChangeType.CREATE, "_entity_");
            if (hasCreateMarker) {
                return changes;
            }

            changes.addAll(trackEntityCreation(entityType, entityId, entity));
            if (!changes.isEmpty()) {
                fieldChangeRepository.saveAll(changes);
                log.info("Backfilled {} synthetic create FieldChanges for {} #{}",
                    changes.size(), entityType, entityId);

                // Publish afterCommit (of this REQUIRES_NEW tx), NOT synchronously pre-commit — otherwise
                // the @Async onChangesDetected handler (whose commit-wait sleep was removed in Inc 1)
                // can read these rows back before this tx commits, judge them "missing", and re-insert
                // them (spurious restored_missing / duplicate-PK). This path is live via
                // NgLotoPointService / AdminFunctionalitiesService / WorkRequestSyncRepairService.
                // publishChangesOnCommit (no FileObject hook) matches the original synchronous call.
                publishChangesOnCommit(changes);
            }
        } catch (Exception e) {
            log.error("Error ensuring create history for {} #{}: {}", entityType, entityId, e.getMessage(), e);
        }

        return changes;
    }

    /**
     * Track entity update using map of original values - called from EntityListener
     * Compares original database values (from Hibernate snapshot) with current entity values
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T extends BaseIdEntity> List<FieldChange> trackEntityUpdate(Map<String, Object> originalValues, T newEntity) {
        return performTrackEntityUpdate(originalValues, newEntity);
    }

    /**
     * Same diff/emit logic as {@link #trackEntityUpdate(Map, BaseIdEntity)} but
     * joins the caller's active transaction instead of opening a new one
     * ({@link Propagation#MANDATORY}). Used by the dedup pipeline so that
     * synthetic {@code FieldChange} rows for {@code @ManyToMany} collection
     * mutations commit or roll back atomically with the underlying JPA repoint —
     * a {@code REQUIRES_NEW} emission would commit independently and could
     * survive a later rollback of the outer dedup transaction, leaving clients
     * with a phantom collection change that never happened on the hub.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public <T extends BaseIdEntity> List<FieldChange> trackEntityUpdateInCurrentTx(
            Map<String, Object> originalValues, T newEntity) {
        return performTrackEntityUpdate(originalValues, newEntity);
    }

    /**
     * Emit a single synthetic relationship FieldChange inside the caller's transaction.
     * Use this when application code mutates a join table explicitly and Hibernate's
     * entity listener is not a reliable source of a durable collection diff.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public <T extends BaseIdEntity> Optional<FieldChange> trackRelationshipUpdateInCurrentTx(
            T entity,
            String fieldName,
            Object oldValue,
            Object newValue,
            String relationshipType) {
        if (entity == null || entity.getId() == null) {
            log.warn("Cannot track relationship update: entity or ID is null");
            return Optional.empty();
        }

        if (syncContext.isSyncing()) {
            log.debug("Skipping relationship update tracking - in sync context for {} #{} field {}",
                entity.getClass().getSimpleName(), entity.getId(), fieldName);
            return Optional.empty();
        }

        if (areValuesEqual(oldValue, newValue)) {
            return Optional.empty();
        }

        String entityType = entity.getClass().getSimpleName();
        FieldChange change = createFieldChange(
            entityType,
            entity.getId(),
            fieldName,
            oldValue,
            newValue,
            FieldChange.ChangeType.UPDATE,
            relationshipType
        );
        FieldChange saved = fieldChangeRepository.save(change);
        log.info("field_change.relationship_saved entity={}#{} field={} old={} new={} publishMode=afterCommit",
            entityType, entity.getId(), fieldName, truncateValue(saved.getOldValue()), truncateValue(saved.getNewValue()));
        publishOnCommit(List.of(saved), entityType, entity);
        return Optional.of(saved);
    }

    private <T extends BaseIdEntity> List<FieldChange> performTrackEntityUpdate(
            Map<String, Object> originalValues, T newEntity) {
        List<FieldChange> changes = new ArrayList<>();

        if (newEntity == null || newEntity.getId() == null) {
            log.warn("Cannot track update: entity or ID is null");
            return changes;
        }

        // Skip tracking entirely if we're in sync context
        // This prevents creating FieldChange records for entities being updated from sync,
        // which could interfere with the original changes being applied
        if (syncContext.isSyncing()) {
            log.debug("Skipping entity update tracking - in sync context for {} #{}",
                newEntity.getClass().getSimpleName(), newEntity.getId());
            return changes;
        }

        if (originalValues == null || originalValues.isEmpty()) {
            log.warn("Cannot track update: no original values captured");
            return changes;
        }

        String entityType = newEntity.getClass().getSimpleName();
        Long entityId = newEntity.getId();

        try {
            log.debug("trackEntityUpdate (map-based) called for {} #{} with {} original values",
                entityType, entityId, originalValues.size());

            // Compare each field (using cached field info for better performance)
            for (CachedFieldInfo fieldInfo : getCachedFields(newEntity.getClass())) {
                if (fieldInfo.shouldTrack) {
                    try {
                        Object oldValue = originalValues.get(fieldInfo.fieldName);
                        Object newValue = fieldInfo.field.get(newEntity);

                        if (!areValuesEqual(oldValue, newValue)) {
                            // IMPORTANT: Skip false-positive changes where the 'name' field appears to be
                            // "changing" from a value to null. This can happen during cascade updates
                            // (e.g., when Vendor is renamed, FileObject may be marked dirty even though
                            // no FileObject fields actually changed). In such cases, the in-memory entity
                            // might have uninitialized/null fields due to Hibernate proxy behavior.
                            // This is a protective measure - it's unlikely someone intentionally clears a name.
                            if ("name".equals(fieldInfo.fieldName) && oldValue != null && newValue == null) {
                                log.debug("Skipping suspicious 'name' change {}.{}: '{}' -> null " +
                                    "(likely cascade false-positive, not a real user change)",
                                    entityType, fieldInfo.fieldName, truncateValue(oldValue));
                                continue;
                            }

                            FieldChange fieldChange = createFieldChange(
                                entityType, entityId, fieldInfo.fieldName,
                                oldValue, newValue,
                                FieldChange.ChangeType.UPDATE,
                                fieldInfo.relationshipType
                            );
                            changes.add(fieldChange);
                            log.debug("Field CHANGED: {}.{} = '{}' -> '{}'", entityType, fieldInfo.fieldName,
                                truncateValue(oldValue), truncateValue(newValue));
                        }
                    } catch (Exception e) {
                        log.warn("Error comparing field {}: {}", fieldInfo.fieldName, e.getMessage());
                    }
                }
            }

            log.debug("Found {} changes for {} #{}", changes.size(), entityType, entityId);

        } catch (Exception e) {
            // This catch guards ONLY the diff computation above. Persistence is deliberately
            // OUTSIDE it (below): the prior code did saveAll() inside this catch, so a persist
            // failure was swallowed while a non-empty `changes` was still returned — which
            // defeats the fail-loud guard in ValueReferenceRepointService.emitPendingFieldChanges
            // (it treats a non-empty return as "row written"). Persist failures must PROPAGATE.
            log.error("Error building field-change diff for {} #{}: {}", entityType, entityId, e.getMessage(), e);
        }

        if (!changes.isEmpty()) {
            // IMPORTANT: persist via an immediate same-transaction JDBC INSERT, NOT
            // fieldChangeRepository.saveAll(). @PostUpdate fires DURING the commit-time flush;
            // a JPA saveAll there only registers a write-behind ActionQueue insert that Hibernate
            // never re-drains for a "terminal" update (entity dirtied, then the tx returns with no
            // later flush — every LOTO lifecycle transition), so the UPDATE change-log row was
            // silently dropped while the entity's own UPDATE committed. A direct INSERT on the
            // session's own JDBC connection bypasses the ActionQueue and commits atomically with
            // the entity UPDATE (same connection => rolls back together).
            persistFieldChangesOnConnection(changes);
            boolean txActive = TransactionSynchronizationManager.isSynchronizationActive();
            log.info("field_change.saved entity={}#{} count={} syncedToMachines={} publishMode={}",
                entityType, entityId, changes.size(),
                changes.get(0).getSyncedToMachines(),
                txActive ? "afterCommit" : "immediate");

            // Defer publication (and FileObjectSyncHandler notification) to afterCommit of the
            // active transaction so a rollback doesn't broadcast an SSE event for a FieldChange
            // row that never committed. HubLocalChangeBroadcaster publishes asynchronously.
            publishOnCommit(changes, entityType, newEntity);
        }

        return changes;
    }

    // FieldChange table column coupling — hand-written because these rows are INSERTed via raw JDBC
    // on the session's own connection (see persistFieldChangesOnConnection). Column names/order/types
    // MUST match the field_change schema; a mismatch is caught at build time by the schema-drift guard
    // test (asserts this column set against INFORMATION_SCHEMA). timestamp/received_at are
    // TIMESTAMP WITH TIME ZONE, id is UUID, change_type is VARCHAR (EnumType.STRING).
    private static final String FIELD_CHANGE_INSERT_SQL =
        "INSERT INTO field_change (id, entity_type, entity_id, field_name, old_value, new_value, "
        + "timestamp, origin_machine_id, origin_machine_name, synced_to_machines, change_type, "
        + "relationship_type, received_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

    /**
     * Persist UPDATE FieldChange rows via an IMMEDIATE parameterized JDBC INSERT executed on the
     * current transaction's own Hibernate connection ({@link SessionImplementor#doWork}).
     *
     * <p>Why not {@code fieldChangeRepository.saveAll()}? These rows are emitted from
     * {@code @PostUpdate}, which fires DURING the commit-time flush. A JPA persist there only enqueues
     * a write-behind insert that Hibernate never re-drains for a terminal update (no subsequent flush)
     * — the row is silently lost while the entity's own UPDATE commits. A direct INSERT bypasses the
     * ActionQueue, lands on the live connection immediately, and is committed by the SAME transaction's
     * COMMIT — so it is both durable (survives the terminal flush) and atomic (rolls back with the
     * entity on a pair/outer rollback). Same mid-flush-safe raw-JDBC idiom as
     * {@code EntityStateCapture.queryJoinTable}. Exceptions PROPAGATE (no swallow) so the dedup pair
     * rolls back on failure rather than committing a repoint clients never see.
     */
    private void persistFieldChangesOnConnection(List<FieldChange> changes) {
        if (changes == null || changes.isEmpty()) return;
        // MANDATORY propagation guarantees a live tx on every real caller; assert rather than silently
        // autocommit on a fresh connection (which would break rollback atomicity).
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException(
                "persistFieldChangesOnConnection requires an active transaction (FieldChange rows must "
                + "commit atomically with the entity change)");
        }
        for (FieldChange fc : changes) {
            if (fc.getId() == null) fc.setId(UUID.randomUUID()); // mirrors GenerationType.UUID (Java-assigned)
        }
        entityManager.unwrap(SessionImplementor.class).doWork(conn -> {
            try (PreparedStatement ps = conn.prepareStatement(FIELD_CHANGE_INSERT_SQL)) {
                for (FieldChange fc : changes) {
                    ps.setObject(1, fc.getId());                          // id                   UUID
                    ps.setString(2, fc.getEntityType());                 // entity_type          VARCHAR NOT NULL
                    ps.setLong(3, fc.getEntityId());                     // entity_id            BIGINT  NOT NULL
                    ps.setString(4, fc.getFieldName());                  // field_name           VARCHAR NOT NULL
                    setNullableString(ps, 5, fc.getOldValue());          // old_value            VARCHAR
                    setNullableString(ps, 6, fc.getNewValue());          // new_value            VARCHAR
                    setNullableInstant(ps, 7, fc.getTimestamp());        // timestamp            TSTZ    NOT NULL
                    ps.setString(8, fc.getOriginMachineId());            // origin_machine_id    VARCHAR NOT NULL
                    ps.setString(9, fc.getOriginMachineName());          // origin_machine_name  VARCHAR NOT NULL
                    setNullableString(ps, 10, fc.getSyncedToMachines()); // synced_to_machines   VARCHAR
                    ps.setString(11, fc.getChangeType().name());         // change_type          VARCHAR NOT NULL (EnumType.STRING)
                    setNullableString(ps, 12, fc.getRelationshipType()); // relationship_type    VARCHAR
                    setNullableInstant(ps, 13, fc.getReceivedAt());      // received_at          TSTZ
                    ps.addBatch();
                }
                ps.executeBatch();
            }
        });
    }

    private static void setNullableString(PreparedStatement ps, int idx, String value) throws SQLException {
        if (value == null) ps.setNull(idx, Types.VARCHAR);
        else ps.setString(idx, value);
    }

    /** Bind an {@link Instant} to a {@code TIMESTAMP WITH TIME ZONE} column as a UTC OffsetDateTime. */
    private static void setNullableInstant(PreparedStatement ps, int idx, Instant value) throws SQLException {
        if (value == null) ps.setNull(idx, Types.TIMESTAMP_WITH_TIMEZONE);
        else ps.setObject(idx, value.atOffset(ZoneOffset.UTC));
    }

    /**
     * Publish {@code changes} via {@link SyncEventPublisher}, deferring to
     * {@code afterCommit} of the active transaction so a rollback (REQUIRES_NEW
     * tx rolling back, or the outer pair tx rolling back when this is reached
     * via MANDATORY propagation) doesn't leak SSE events for FieldChange rows
     * that aren't actually in the DB. If no synchronization is active
     * (e.g. background workers calling outside a Spring tx), publish
     * immediately — there's no rollback to worry about.
     */
    private void publishOnCommit(List<FieldChange> changes, String entityType,
                                 BaseIdEntity newEntity) {
        publishOnCommit(changes, entityType, newEntity, false);
    }

    private void publishOnCommit(List<FieldChange> changes, String entityType,
                                 BaseIdEntity newEntity, boolean isCreate) {
        // Capture the origin client id from the current request thread NOW —
        // once the afterCommit callback fires the request thread may already
        // be re-used by a different request whose header would leak in.
        final String originClientId = requestClientIdContext.currentOrNull();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.debug("Publishing {} changes for sync broadcast (afterCommit)", changes.size());
                    try {
                        syncEventPublisher.publishChanges(changes, originClientId);
                    } catch (Exception e) {
                        log.error("afterCommit: failed to publish {} change(s) for {} #{}",
                                changes.size(), entityType, newEntity.getId(), e);
                    }
                    if ("FileObject".equals(entityType) && fileObjectSyncHandler != null) {
                        try {
                            fileObjectSyncHandler.onLocalFileObjectChanged(
                                (com.dk_power.power_plant_java.entities.files.FileObject) newEntity, isCreate);
                        } catch (Exception e) {
                            log.error("afterCommit: FileObjectSyncHandler failed for #{}",
                                    newEntity.getId(), e);
                        }
                    }
                }
            });
        } else {
            log.debug("Publishing {} changes for sync broadcast (no active synchronization)", changes.size());
            syncEventPublisher.publishChanges(changes, originClientId);
            if ("FileObject".equals(entityType) && fileObjectSyncHandler != null) {
                fileObjectSyncHandler.onLocalFileObjectChanged(
                    (com.dk_power.power_plant_java.entities.files.FileObject) newEntity, isCreate);
            }
        }
    }

    /**
     * Publish field-changes on commit WITHOUT the FileObject upload hook — used for DELETE, where
     * re-notifying the file handler for a removed entity would be wrong.
     */
    private void publishChangesOnCommit(List<FieldChange> changes) {
        final String originClientId = requestClientIdContext.currentOrNull();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        syncEventPublisher.publishChanges(changes, originClientId);
                    } catch (Exception e) {
                        log.error("afterCommit: failed to publish {} delete change(s): {}",
                                changes.size(), e.getMessage(), e);
                    }
                }
            });
        } else {
            syncEventPublisher.publishChanges(changes, originClientId);
        }
    }

    /**
     * Track entity deletion (soft delete)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public <T extends BaseIdEntity> FieldChange trackDelete(T entity) {
        if (entity == null || entity.getId() == null) {
            log.warn("Cannot track delete: entity or ID is null");
            return null;
        }

        // Skip tracking if we're in sync context
        if (syncContext.isSyncing()) {
            log.debug("Skipping delete tracking - in sync context for {} #{}",
                entity.getClass().getSimpleName(), entity.getId());
            return null;
        }

        FieldChange deleteChange = new FieldChange(
            entity.getClass().getSimpleName(),
            entity.getId(),
            "_entity_",
            "EXISTED",
            "DELETED",
            syncConfig.getMachineId(),
            syncConfig.getMachineName(),
            FieldChange.ChangeType.DELETE
        );

        FieldChange saved = fieldChangeRepository.save(deleteChange);
        // Publish afterCommit so a hard-delete propagates immediately (previously trackDelete NEVER
        // published, so a hard-delete only reached the hub on the next 15s periodic send). Kept in its
        // own REQUIRES_NEW tx (like create emission) to avoid a reentrant-flush "could not commit"
        // during the entity's @PostRemove; afterCommit of the inner tx means the row is committed
        // before it publishes.
        publishChangesOnCommit(java.util.List.of(saved));
        return saved;
    }

    /**
     * Create a FieldChange object for a specific field
     */
    private FieldChange createFieldChange(String entityType, Long entityId, String fieldName,
                                          Object oldValue, Object newValue,
                                          FieldChange.ChangeType changeType,
                                          String relationshipType) {
        FieldChange change = new FieldChange(
            entityType, entityId, fieldName,
            serializeValue(oldValue),
            serializeValue(newValue),
            syncConfig.getMachineId(),
            syncConfig.getMachineName(),
            changeType
        );
        change.setRelationshipType(relationshipType);
        return change;
    }

    /**
     * Serialize a value to JSON string for storage
     */
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

            // Handle plain strings — return as-is to avoid double-encoding.
            // JSON LOB fields (e.g., positionJson, sizeJson) are stored as raw JSON strings.
            // Using writeValueAsString on them would add surrounding quotes and escape inner
            // quotes, causing corruption when deserializeValue strips quotes but not escapes.
            if (value instanceof String) {
                return (String) value;
            }

            // Handle other complex types via Jackson
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("Error serializing value of type {}: {}", value.getClass().getSimpleName(), e.getMessage());
            return String.valueOf(value);
        }
    }

    /**
     * Compare two values for equality, handling collections and entities.
     * Special handling for Hibernate snapshot values (IDs) vs current entity values (full objects).
     */
    private boolean areValuesEqual(Object oldValue, Object newValue) {
        if (oldValue == null && newValue == null) return true;

        // Handle null vs empty collection - treat as equal
        if (oldValue == null && newValue instanceof Collection && ((Collection<?>) newValue).isEmpty()) return true;
        if (newValue == null && oldValue instanceof Collection && ((Collection<?>) oldValue).isEmpty()) return true;

        if (oldValue == null || newValue == null) return false;

        // Handle entity references - compare by ID
        // Case 1: Both are entities
        if (oldValue instanceof BaseIdEntity && newValue instanceof BaseIdEntity) {
            Long oldId = ((BaseIdEntity) oldValue).getId();
            Long newId = ((BaseIdEntity) newValue).getId();
            return Objects.equals(oldId, newId);
        }

        // Case 2: Hibernate snapshot returns entity ID (Long), current value is entity
        // This happens because getDatabaseSnapshot() returns foreign key IDs for ManyToOne relations
        if (oldValue instanceof Long && newValue instanceof BaseIdEntity) {
            Long newId = ((BaseIdEntity) newValue).getId();
            return Objects.equals(oldValue, newId);
        }
        if (oldValue instanceof BaseIdEntity && newValue instanceof Long) {
            Long oldId = ((BaseIdEntity) oldValue).getId();
            return Objects.equals(oldId, newValue);
        }

        // Handle collections - compare by content
        if (oldValue instanceof Collection && newValue instanceof Collection) {
            return collectionsEqual((Collection<?>) oldValue, (Collection<?>) newValue);
        }

        return Objects.equals(oldValue, newValue);
    }

    /**
     * Compare two collections for equality
     */
    private boolean collectionsEqual(Collection<?> col1, Collection<?> col2) {
        if (col1.size() != col2.size()) return false;

        // Extract IDs from both collections
        Set<Long> ids1 = extractIdsFromCollection(col1);
        Set<Long> ids2 = extractIdsFromCollection(col2);

        // If both have IDs, compare them
        if (ids1 != null && ids2 != null) {
            return ids1.equals(ids2);
        }

        // For other collections, use standard equality
        return Objects.equals(new HashSet<>(col1), new HashSet<>(col2));
    }

    /**
     * Extract IDs from a collection, whether it contains entities, Longs, or Numbers.
     * Returns null if the collection doesn't contain ID-like elements.
     */
    private Set<Long> extractIdsFromCollection(Collection<?> col) {
        if (col.isEmpty()) {
            return new HashSet<>();
        }

        Object first = col.iterator().next();

        // Collection of entities - extract their IDs
        if (first instanceof BaseIdEntity) {
            Set<Long> ids = new HashSet<>();
            for (Object item : col) {
                Long id = ((BaseIdEntity) item).getId();
                if (id != null) ids.add(id);
            }
            return ids;
        }

        // Collection of Longs (from join table query)
        if (first instanceof Long) {
            Set<Long> ids = new HashSet<>();
            for (Object item : col) {
                ids.add((Long) item);
            }
            return ids;
        }

        // Collection of Numbers (some DBs return Integer/BigInteger for IDs)
        if (first instanceof Number) {
            Set<Long> ids = new HashSet<>();
            for (Object item : col) {
                ids.add(((Number) item).longValue());
            }
            return ids;
        }

        // Not an ID collection
        return null;
    }

    /**
     * Truncate value for logging
     */
    private String truncateValue(Object value) {
        if (value == null) return "null";
        String str = String.valueOf(value);
        if (str.length() > 50) {
            return str.substring(0, 47) + "...";
        }
        return str;
    }
}
