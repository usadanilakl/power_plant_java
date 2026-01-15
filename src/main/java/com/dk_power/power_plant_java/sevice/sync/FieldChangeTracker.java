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

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FieldChangeTracker {

    private final FieldChangeRepository fieldChangeRepository;
    private final SyncConfig syncConfig;
    private final ObjectMapper objectMapper;
    private final SyncEventPublisher syncEventPublisher;
    private final SyncContext syncContext;

    // Fields to exclude from tracking
    private static final Set<String> EXCLUDED_FIELDS = Set.of(
        "dateCreated", "dateModified", "objectType", "serialVersionUID",
        "hibernateLazyInitializer", "handler"
    );

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

        String entityType = newEntity.getClass().getSimpleName();
        Long entityId = newEntity.getId();

        if (entityId == null) {
            log.warn("Cannot track changes: entity ID is null for {}", entityType);
            return changes;
        }

        try {
            // Handle create (new entity)
            if (oldEntity == null) {
                changes.addAll(trackEntityCreation(entityType, entityId, newEntity));
            } else {
                // Handle update - compare each field
                changes.addAll(trackEntityUpdate(entityType, entityId, oldEntity, newEntity));
            }

            // Save all changes and trigger sync (only if not already processing incoming sync)
            if (!changes.isEmpty()) {
                fieldChangeRepository.saveAll(changes);
                log.debug("Tracked {} field changes for {} #{}", changes.size(), entityType, entityId);

                // Only broadcast if this is a LOCAL change, not an incoming sync
                // This prevents infinite sync loops between machines
                if (!syncContext.isSyncing()) {
                    syncEventPublisher.publishChanges(changes);
                } else {
                    log.debug("Skipping broadcast - change originated from sync");
                }
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

        // Track all non-null fields as initial values
        for (Field field : getAllFields(newEntity.getClass())) {
            if (shouldTrackField(field)) {
                try {
                    field.setAccessible(true);
                    Object newValue = field.get(newEntity);
                    if (newValue != null) {
                        FieldChange fieldChange = createFieldChange(
                            entityType, entityId, field.getName(),
                            null, newValue,
                            FieldChange.ChangeType.CREATE,
                            getRelationshipType(field)
                        );
                        changes.add(fieldChange);
                    }
                } catch (Exception e) {
                    log.warn("Error tracking field {} on create: {}", field.getName(), e.getMessage());
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

        for (Field field : getAllFields(newEntity.getClass())) {
            if (shouldTrackField(field)) {
                try {
                    field.setAccessible(true);
                    Object oldValue = field.get(oldEntity);
                    Object newValue = field.get(newEntity);

                    if (!areValuesEqual(oldValue, newValue)) {
                        FieldChange fieldChange = createFieldChange(
                            entityType, entityId, field.getName(),
                            oldValue, newValue,
                            FieldChange.ChangeType.UPDATE,
                            getRelationshipType(field)
                        );
                        changes.add(fieldChange);
                        log.trace("Field changed: {}.{} = {} -> {}", entityType, field.getName(),
                            truncateValue(oldValue), truncateValue(newValue));
                    }
                } catch (Exception e) {
                    log.warn("Error comparing field {}: {}", field.getName(), e.getMessage());
                }
            }
        }

        return changes;
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

        return fieldChangeRepository.save(deleteChange);
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

            // Handle simple values
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("Error serializing value of type {}: {}", value.getClass().getSimpleName(), e.getMessage());
            return String.valueOf(value);
        }
    }

    /**
     * Check if a field should be tracked
     */
    private boolean shouldTrackField(Field field) {
        String fieldName = field.getName();

        // Skip excluded fields
        if (EXCLUDED_FIELDS.contains(fieldName)) return false;

        // Skip transient fields
        if (field.isAnnotationPresent(Transient.class)) return false;

        // Skip JsonIgnore fields
        if (field.isAnnotationPresent(JsonIgnore.class)) return false;

        // Skip static fields
        if (Modifier.isStatic(field.getModifiers())) return false;

        // Skip final fields
        if (Modifier.isFinal(field.getModifiers())) return false;

        return true;
    }

    /**
     * Get the relationship type annotation if present
     */
    private String getRelationshipType(Field field) {
        if (field.isAnnotationPresent(ManyToOne.class)) return "ManyToOne";
        if (field.isAnnotationPresent(OneToMany.class)) return "OneToMany";
        if (field.isAnnotationPresent(ManyToMany.class)) return "ManyToMany";
        if (field.isAnnotationPresent(OneToOne.class)) return "OneToOne";
        return null;
    }

    /**
     * Get all fields including inherited fields
     */
    private List<Field> getAllFields(Class<?> clazz) {
        List<Field> fields = new ArrayList<>();
        while (clazz != null && clazz != Object.class) {
            fields.addAll(Arrays.asList(clazz.getDeclaredFields()));
            clazz = clazz.getSuperclass();
        }
        return fields;
    }

    /**
     * Compare two values for equality, handling collections and entities
     */
    private boolean areValuesEqual(Object oldValue, Object newValue) {
        if (oldValue == null && newValue == null) return true;
        if (oldValue == null || newValue == null) return false;

        // Handle entity references - compare by ID
        if (oldValue instanceof BaseIdEntity && newValue instanceof BaseIdEntity) {
            Long oldId = ((BaseIdEntity) oldValue).getId();
            Long newId = ((BaseIdEntity) newValue).getId();
            return Objects.equals(oldId, newId);
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

        // For entity collections, compare by IDs
        if (!col1.isEmpty() && col1.iterator().next() instanceof BaseIdEntity) {
            Set<Long> ids1 = new HashSet<>();
            Set<Long> ids2 = new HashSet<>();

            for (Object item : col1) {
                Long id = ((BaseIdEntity) item).getId();
                if (id != null) ids1.add(id);
            }
            for (Object item : col2) {
                Long id = ((BaseIdEntity) item).getId();
                if (id != null) ids2.add(id);
            }

            return ids1.equals(ids2);
        }

        // For other collections, use standard equality
        return Objects.equals(new HashSet<>(col1), new HashSet<>(col2));
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
