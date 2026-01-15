package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Captures entity state before updates for comparison during change tracking.
 *
 * Uses thread-local storage to safely capture state across the JPA lifecycle.
 */
@Component
@Slf4j
public class EntityStateCapture {

    // Thread-local map to store entity states before update
    // Key: entity ID, Value: cloned entity state
    private final ThreadLocal<Map<Long, BaseIdEntity>> capturedStates =
        ThreadLocal.withInitial(ConcurrentHashMap::new);

    /**
     * Capture the current state of an entity before it's updated
     */
    public void captureState(BaseIdEntity entity) {
        if (entity == null || entity.getId() == null) {
            return;
        }

        try {
            BaseIdEntity clone = cloneEntity(entity);
            capturedStates.get().put(entity.getId(), clone);
            log.trace("Captured state for {} #{}", entity.getClass().getSimpleName(), entity.getId());
        } catch (Exception e) {
            log.error("Error capturing entity state: {}", e.getMessage());
        }
    }

    /**
     * Get and remove the captured state for an entity
     */
    public BaseIdEntity getAndClearState(Long entityId) {
        if (entityId == null) {
            return null;
        }
        return capturedStates.get().remove(entityId);
    }

    /**
     * Clear all captured states for the current thread
     */
    public void clearAll() {
        capturedStates.get().clear();
    }

    /**
     * Create a shallow clone of an entity to capture its current state
     */
    @SuppressWarnings("unchecked")
    private <T extends BaseIdEntity> T cloneEntity(T entity) {
        try {
            Class<?> clazz = entity.getClass();
            T clone = (T) clazz.getDeclaredConstructor().newInstance();

            // Copy all fields including inherited ones
            Class<?> currentClass = clazz;
            while (currentClass != null && currentClass != Object.class) {
                for (Field field : currentClass.getDeclaredFields()) {
                    if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) {
                        continue;
                    }
                    if (java.lang.reflect.Modifier.isFinal(field.getModifiers())) {
                        continue;
                    }

                    field.setAccessible(true);
                    Object value = field.get(entity);

                    // For collections, we don't deep copy - just copy reference
                    // This is fine for comparison purposes
                    field.set(clone, value);
                }
                currentClass = currentClass.getSuperclass();
            }

            return clone;
        } catch (Exception e) {
            log.error("Error cloning entity {}: {}", entity.getClass().getSimpleName(), e.getMessage());
            return null;
        }
    }
}
