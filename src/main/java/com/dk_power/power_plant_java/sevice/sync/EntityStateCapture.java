package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.engine.spi.SessionImplementor;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Captures entity state before updates for comparison during change tracking.
 *
 * Uses Hibernate to fetch the original (database) values for comparison,
 * since by the time @PreUpdate is called, the entity in memory is already modified.
 */
@Component
@Slf4j
public class EntityStateCapture {

    @PersistenceContext
    private EntityManager entityManager;

    // Thread-local map to store entity field values before update
    // Key: entity ID, Value: map of field name -> original value
    private final ThreadLocal<Map<Long, Map<String, Object>>> capturedStates =
        ThreadLocal.withInitial(ConcurrentHashMap::new);

    /**
     * Capture the ORIGINAL (database) state of an entity before it's updated.
     * This fetches the current values from the database, not from the modified entity in memory.
     */
    public void captureState(BaseIdEntity entity) {
        if (entity == null || entity.getId() == null) {
            return;
        }

        try {
            // Get the original values from Hibernate's persistence context
            Map<String, Object> originalValues = getOriginalValues(entity);
            if (originalValues != null && !originalValues.isEmpty()) {
                capturedStates.get().put(entity.getId(), originalValues);
                log.trace("Captured {} original field values for {} #{}",
                    originalValues.size(), entity.getClass().getSimpleName(), entity.getId());
            }
        } catch (Exception e) {
            log.error("Error capturing entity state for {} #{}: {}",
                entity.getClass().getSimpleName(), entity.getId(), e.getMessage());
        }
    }

    /**
     * Get the original (database) values for an entity using Hibernate's Session
     */
    private Map<String, Object> getOriginalValues(BaseIdEntity entity) {
        Map<String, Object> originalValues = new HashMap<>();

        try {
            SessionImplementor session = entityManager.unwrap(SessionImplementor.class);

            // Get the entity persister for this entity type
            EntityPersister persister = session.getEntityPersister(entity.getClass().getName(), entity);

            // Get the entity's persisted state from Hibernate (original database values)
            Object[] databaseState = persister.getDatabaseSnapshot(entity.getId(), session);

            if (databaseState == null) {
                log.warn("No database state found for {} #{}", entity.getClass().getSimpleName(), entity.getId());
                return originalValues;
            }

            // Get property names
            String[] propertyNames = persister.getPropertyNames();

            // Map property names to their original values
            for (int i = 0; i < propertyNames.length && i < databaseState.length; i++) {
                originalValues.put(propertyNames[i], databaseState[i]);
                // Debug log for 'name' field specifically
                if ("name".equals(propertyNames[i])) {
                    log.info("DB SNAPSHOT for {} #{}: name='{}' (type={})",
                        entity.getClass().getSimpleName(), entity.getId(),
                        databaseState[i],
                        databaseState[i] != null ? databaseState[i].getClass().getSimpleName() : "null");
                }
            }

            log.trace("Retrieved {} original values from database for {} #{}",
                originalValues.size(), entity.getClass().getSimpleName(), entity.getId())

        } catch (Exception e) {
            log.warn("Could not get database state via Hibernate for {} #{}, falling back to reflection: {}",
                entity.getClass().getSimpleName(), entity.getId(), e.getMessage());
            // Fallback: this won't work correctly but at least won't crash
            return fallbackCloneToMap(entity);
        }

        return originalValues;
    }

    /**
     * Fallback: clone entity to map (won't capture true original values but prevents crashes)
     */
    private Map<String, Object> fallbackCloneToMap(BaseIdEntity entity) {
        Map<String, Object> values = new HashMap<>();
        try {
            Class<?> currentClass = entity.getClass();
            while (currentClass != null && currentClass != Object.class) {
                for (Field field : currentClass.getDeclaredFields()) {
                    if (java.lang.reflect.Modifier.isStatic(field.getModifiers()) ||
                        java.lang.reflect.Modifier.isFinal(field.getModifiers())) {
                        continue;
                    }
                    field.setAccessible(true);
                    values.put(field.getName(), field.get(entity));
                }
                currentClass = currentClass.getSuperclass();
            }
        } catch (Exception e) {
            log.error("Fallback clone failed: {}", e.getMessage());
        }
        return values;
    }

    /**
     * Get and remove the captured state for an entity
     * @return Map of field name -> original value, or null if not captured
     */
    public Map<String, Object> getAndClearStateMap(Long entityId) {
        if (entityId == null) {
            return null;
        }
        return capturedStates.get().remove(entityId);
    }

    /**
     * Legacy method - returns null, use getAndClearStateMap instead
     * @deprecated Use getAndClearStateMap for the new map-based approach
     */
    @Deprecated
    public BaseIdEntity getAndClearState(Long entityId) {
        // This method is kept for compatibility but returns null
        // The new implementation uses getAndClearStateMap
        return null;
    }

    /**
     * Clear all captured states for the current thread
     */
    public void clearAll() {
        capturedStates.get().clear();
    }
}
