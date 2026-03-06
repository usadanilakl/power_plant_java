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
     * Capture entity state before update for comparison.
     * Uses Hibernate to get the ORIGINAL database values before the in-memory changes.
     */
    @PreUpdate
    public void preUpdate(Object entity) {
        if (entityStateCapture != null && entity instanceof BaseIdEntity) {
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
        if (fieldChangeTracker != null && entity instanceof BaseIdEntity) {
            try {
                BaseIdEntity baseEntity = (BaseIdEntity) entity;
                // For new entities, old state is null
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
        if (fieldChangeTracker != null && entityStateCapture != null && entity instanceof BaseIdEntity) {
            try {
                BaseIdEntity newState = (BaseIdEntity) entity;
                Map<String, Object> originalValues = entityStateCapture.getAndClearStateMap(newState.getId());

                if (originalValues != null && !originalValues.isEmpty()) {
                    fieldChangeTracker.trackEntityUpdate(originalValues, newState);
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
        if (fieldChangeTracker != null && entity instanceof BaseIdEntity) {
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
