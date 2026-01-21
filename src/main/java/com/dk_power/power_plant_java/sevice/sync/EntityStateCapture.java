package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.engine.spi.SessionImplementor;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Captures entity state before updates for comparison during change tracking.
 *
 * Uses Hibernate to fetch the original (database) values for comparison,
 * since by the time @PreUpdate is called, the entity in memory is already modified.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class EntityStateCapture {

    @PersistenceContext
    private EntityManager entityManager;

    private final SyncContext syncContext;

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
            }

            log.trace("Retrieved {} original values from database for {} #{}",
                originalValues.size(), entity.getClass().getSimpleName(), entity.getId());

            // Also capture ManyToMany collections (not included in getDatabaseSnapshot)
            // Skip during sync context - the connection may be closed or in an inconsistent state,
            // and we don't need to track ManyToMany changes for incoming sync (they're already handled)
            if (!syncContext.isSyncing()) {
                log.info("Capturing ManyToMany collections for {} #{} (not in sync context)",
                    entity.getClass().getSimpleName(), entity.getId());
                captureManyToManyCollections(entity, originalValues);
            } else {
                log.debug("Skipping ManyToMany capture for {} #{} - in sync context",
                    entity.getClass().getSimpleName(), entity.getId());
            }

        } catch (Exception e) {
            log.warn("Could not get database state via Hibernate for {} #{}, falling back to reflection: {}",
                entity.getClass().getSimpleName(), entity.getId(), e.getMessage());
            // Fallback: this won't work correctly but at least won't crash
            return fallbackCloneToMap(entity);
        }

        return originalValues;
    }

    /**
     * Capture ManyToMany collection values by querying the join tables directly.
     * These are NOT included in Hibernate's getDatabaseSnapshot() because they're
     * stored in separate join tables, not in the entity's own table.
     */
    private void captureManyToManyCollections(BaseIdEntity entity, Map<String, Object> originalValues) {
        Class<?> currentClass = entity.getClass();
        while (currentClass != null && currentClass != Object.class) {
            for (Field field : currentClass.getDeclaredFields()) {
                if (field.isAnnotationPresent(ManyToMany.class)) {
                    // Check if this is the owning side (has @JoinTable)
                    JoinTable joinTable = field.getAnnotation(JoinTable.class);
                    if (joinTable != null) {
                        // This is the owning side - query the join table
                        try {
                            Set<Long> relatedIds = queryJoinTable(
                                joinTable.name(),
                                joinTable.joinColumns()[0].name(),
                                joinTable.inverseJoinColumns()[0].name(),
                                entity.getId()
                            );
                            originalValues.put(field.getName(), relatedIds);
                            log.info("Captured ManyToMany {}.{}: {} related IDs = {}",
                                entity.getClass().getSimpleName(), field.getName(), relatedIds.size(), relatedIds);
                        } catch (Exception e) {
                            log.warn("Error capturing ManyToMany field {}.{}: {}",
                                entity.getClass().getSimpleName(), field.getName(), e.getMessage());
                        }
                    }
                    // Skip inverse side (mappedBy) - will be handled by owning side
                }
            }
            currentClass = currentClass.getSuperclass();
        }
    }

    /**
     * Query a join table to get all related entity IDs for a given owner entity.
     */
    @SuppressWarnings("unchecked")
    private Set<Long> queryJoinTable(String tableName, String ownerColumn, String inverseColumn, Long ownerId) {
        String sql = String.format("SELECT %s FROM %s WHERE %s = :ownerId", inverseColumn, tableName, ownerColumn);
        List<Number> results = entityManager.createNativeQuery(sql)
            .setParameter("ownerId", ownerId)
            .getResultList();

        Set<Long> ids = new HashSet<>();
        for (Number id : results) {
            if (id != null) {
                ids.add(id.longValue());
            }
        }
        return ids;
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
