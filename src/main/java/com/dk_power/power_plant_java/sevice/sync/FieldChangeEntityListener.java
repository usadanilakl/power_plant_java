package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * JPA Entity Listener that automatically tracks field changes for sync.
 *
 * This listener intercepts entity lifecycle events and records changes
 * for field-based synchronization between machines.
 *
 * Note: This is registered via EntityListenerRegistry which handles
 * the Spring dependency injection properly.
 */
@Slf4j
@Component
public class FieldChangeEntityListener {

    private static FieldChangeTracker fieldChangeTracker;
    private static EntityStateCapture entityStateCapture;
    private static SyncContext syncContext;

    // Static setter for Spring to inject dependencies
    public static void setFieldChangeTracker(FieldChangeTracker tracker) {
        fieldChangeTracker = tracker;
    }

    public static void setEntityStateCapture(EntityStateCapture capture) {
        entityStateCapture = capture;
    }

    public static void setSyncContext(SyncContext context) {
        syncContext = context;
    }

    public static boolean isInitialized() {
        return fieldChangeTracker != null && entityStateCapture != null && syncContext != null;
    }

    /**
     * A tracked entity is any {@link BaseIdEntity} not marked {@link LocalOnlyEntity}. The
     * annotation is the single source of truth for the sync opt-out — the {@link SyncRegistryValidator}
     * consults the same marker, so listener and validator can never disagree. ({@code @LocalOnlyEntity}
     * is {@code @Inherited}, so a Hibernate proxy subclass still reports it here.)
     */
    private static boolean isTracked(Object entity) {
        return entity instanceof BaseIdEntity
                && !entity.getClass().isAnnotationPresent(LocalOnlyEntity.class);
    }

    /**
     * Capture entity state before update for comparison.
     * Uses Hibernate to get the ORIGINAL database values before the in-memory changes.
     */
    @PreUpdate
    public void preUpdate(Object entity) {
        if (entityStateCapture != null && isTracked(entity)) {
            entityStateCapture.captureState((BaseIdEntity) entity);
        }
    }

    /**
     * Track changes after entity is persisted (new entity).
     * Skips during sync to prevent re-broadcasting incoming changes.
     */
    @PostPersist
    public void postPersist(Object entity) {
        // Skip change tracking during sync - incoming changes should not be re-tracked
        if (syncContext != null && syncContext.isSyncing()) {
            return;
        }
        if (fieldChangeTracker != null && isTracked(entity)) {
            try {
                BaseIdEntity baseEntity = (BaseIdEntity) entity;
                // Create emission runs in its OWN transaction (REQUIRES_NEW). Joining the entity's own
                // INSERT flush via MANDATORY caused reentrant-flush "could not commit" failures on
                // cascade-inserting saves (e.g. a new LotoStandard also inserts its status Value + join
                // rows). The Inc 1 win kept here is that this now publishes afterCommit (of the inner
                // tx) instead of synchronously pre-commit, so removing CentralSyncService's commit-wait
                // sleep stays safe. Full same-tx CREATE atomicity is deferred to a beforeCommit approach.
                fieldChangeTracker.trackEntityCreation(baseEntity);
                log.debug("Tracked creation of {} #{}",
                    baseEntity.getClass().getSimpleName(), baseEntity.getId());
            } catch (Exception e) {
                log.error("Error tracking entity creation: {}", e.getMessage());
            }
        }
    }

    /**
     * Track changes after entity is updated.
     * Compares the original database values (captured in @PreUpdate) with current values.
     * Skips during sync to prevent re-broadcasting incoming changes.
     */
    @PostUpdate
    public void postUpdate(Object entity) {
        // Skip change tracking during sync - incoming changes should not be re-tracked
        if (syncContext != null && syncContext.isSyncing()) {
            return;
        }
        if (fieldChangeTracker != null && entityStateCapture != null && isTracked(entity)) {
            try {
                BaseIdEntity newState = (BaseIdEntity) entity;
                Map<String, Object> originalValues = entityStateCapture.getAndClearStateMap(newState.getId());

                if (originalValues != null && !originalValues.isEmpty()) {
                    // Use the MANDATORY-propagation variant so the resulting
                    // FieldChange rows join the caller's transaction. The old
                    // REQUIRES_NEW path committed FieldChange rows (and fired
                    // SSE broadcasts via the publishOnCommit afterCommit hook
                    // on the inner tx) independently of the outer tx — which,
                    // for the dedup pair tx, meant a scalar @ManyToOne repoint
                    // could leak a FieldChange + event even when verify-before-
                    // delete later rolled the pair back. @PostUpdate is always
                    // invoked during flush of an active transaction (JPA spec),
                    // so MANDATORY is safe.
                    fieldChangeTracker.trackEntityUpdateInCurrentTx(originalValues, newState);
                    log.debug("Tracked update of {} #{}",
                        newState.getClass().getSimpleName(), newState.getId());
                } else {
                    log.debug("No original state captured for {} #{}, cannot track changes",
                        newState.getClass().getSimpleName(), newState.getId());
                }
            } catch (Exception e) {
                log.error("Error tracking entity update: {}", e.getMessage());
            }
        }
    }

    /**
     * Track entity removal (soft or hard delete)
     */
    @PostRemove
    public void postRemove(Object entity) {
        if (fieldChangeTracker != null && isTracked(entity)) {
            try {
                fieldChangeTracker.trackDelete((BaseIdEntity) entity);
                log.debug("Tracked deletion of {} #{}",
                    entity.getClass().getSimpleName(), ((BaseIdEntity) entity).getId());
            } catch (Exception e) {
                log.error("Error tracking entity deletion: {}", e.getMessage());
            }
        }
    }
}
