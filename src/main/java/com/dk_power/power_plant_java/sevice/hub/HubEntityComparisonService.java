package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.sync.EntityTableRegistry;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Hub-side service for entity-level comparison.
 * Provides entity ID lists and field-level entity data for desktop comparison.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubEntityComparisonService {

    private final JdbcTemplate jdbcTemplate;
    private final EntityTableRegistry entityTableRegistry;
    private final ServiceFacade serviceFacade;
    private final ObjectMapper objectMapper;

    // Cache for trackable fields per entity class (mirrors FieldChangeTracker's approach)
    private static final ConcurrentHashMap<Class<?>, List<FieldInfo>> FIELD_CACHE = new ConcurrentHashMap<>();

    private static final Set<String> EXCLUDED_FIELDS = Set.of(
        "id", "version", "dateCreated", "dateModified", "objectType", "serialVersionUID",
        "hibernateLazyInitializer", "handler"
    );

    public HubEntityComparisonService(JdbcTemplate jdbcTemplate,
                                       EntityTableRegistry entityTableRegistry,
                                       ServiceFacade serviceFacade,
                                       ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.entityTableRegistry = entityTableRegistry;
        this.serviceFacade = serviceFacade;
        this.objectMapper = objectMapper;
    }

    /**
     * Get all non-deleted entity IDs for a given entity type.
     */
    public Set<Long> getEntityIds(String entityType) {
        if (!entityTableRegistry.isRegistered(entityType)) {
            throw new IllegalArgumentException("Unknown entity type: " + entityType);
        }

        String tableName = entityTableRegistry.getTableName(entityType);
        List<Long> ids;
        try {
            ids = jdbcTemplate.queryForList(
                "SELECT id FROM " + tableName + " WHERE deleted = false", Long.class);
        } catch (Exception e) {
            // Table might not have deleted column
            ids = jdbcTemplate.queryForList("SELECT id FROM " + tableName, Long.class);
        }
        return new LinkedHashSet<>(ids);
    }

    /**
     * Get serialized field data for a specific entity.
     * Returns a map of fieldName -> serialized value (same serialization as FieldChangeTracker).
     */
    @Transactional(readOnly = true)
    public Map<String, String> getEntityData(String entityType, Long entityId) {
        SyncableService<?> service = serviceFacade.getService(entityType);
        if (service == null) {
            throw new IllegalArgumentException("No service for entity type: " + entityType);
        }

        BaseIdEntity entity = (BaseIdEntity) service.getEntityById(entityId);
        if (entity == null) {
            return null;
        }

        return serializeEntityFields(entity);
    }

    /**
     * Get dateModified timestamps for a list of entity IDs.
     * Used for stale record detection without fetching full entity data.
     */
    public Map<Long, Instant> getEntityTimestamps(String entityType, List<Long> entityIds) {
        if (entityIds == null || entityIds.isEmpty()) return Collections.emptyMap();
        if (!entityTableRegistry.isRegistered(entityType)) {
            throw new IllegalArgumentException("Unknown entity type: " + entityType);
        }

        String tableName = entityTableRegistry.getTableName(entityType);
        Map<Long, Instant> timestamps = new HashMap<>();

        // Query in batches of 500 to avoid SQL length limits
        int batchSize = 500;
        for (int i = 0; i < entityIds.size(); i += batchSize) {
            List<Long> batch = entityIds.subList(i, Math.min(i + batchSize, entityIds.size()));
            String placeholders = String.join(",", Collections.nCopies(batch.size(), "?"));
            String sql = "SELECT id, date_modified FROM " + tableName + " WHERE id IN (" + placeholders + ")";

            jdbcTemplate.query(sql, batch.toArray(), rs -> {
                long id = rs.getLong("id");
                java.sql.Timestamp ts = rs.getTimestamp("date_modified");
                if (ts != null) {
                    timestamps.put(id, ts.toInstant());
                }
            });
        }
        return timestamps;
    }

    /**
     * Serialize all trackable fields of an entity to a string map.
     * Mirrors the serialization approach from FieldChangeTracker.
     */
    private Map<String, String> serializeEntityFields(BaseIdEntity entity) {
        Map<String, String> fieldMap = new LinkedHashMap<>();

        for (FieldInfo fi : getFields(entity.getClass())) {
            try {
                Object value = fi.field.get(entity);
                fieldMap.put(fi.name, serializeValue(value));
            } catch (Exception e) {
                log.trace("Could not read field {}: {}", fi.name, e.getMessage());
            }
        }
        return fieldMap;
    }

    private String serializeValue(Object value) {
        if (value == null) return null;

        try {
            if (value instanceof BaseIdEntity) {
                Long id = ((BaseIdEntity) value).getId();
                return id != null ? String.valueOf(id) : null;
            }

            if (value instanceof Collection) {
                Collection<?> col = (Collection<?>) value;
                if (!col.isEmpty() && col.iterator().next() instanceof BaseIdEntity) {
                    List<Long> ids = new ArrayList<>();
                    for (Object item : col) {
                        Long id = ((BaseIdEntity) item).getId();
                        if (id != null) ids.add(id);
                    }
                    return objectMapper.writeValueAsString(ids);
                }
            }

            if (value instanceof Enum) {
                return ((Enum<?>) value).name();
            }

            if (value instanceof String) {
                return (String) value;
            }

            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    private List<FieldInfo> getFields(Class<?> clazz) {
        return FIELD_CACHE.computeIfAbsent(clazz, this::buildFieldList);
    }

    private List<FieldInfo> buildFieldList(Class<?> clazz) {
        List<FieldInfo> fields = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Class<?> current = clazz;

        while (current != null && current != Object.class) {
            for (Field field : current.getDeclaredFields()) {
                if (!seen.add(field.getName())) continue;
                if (shouldTrack(field)) {
                    field.setAccessible(true);
                    fields.add(new FieldInfo(field, field.getName()));
                }
            }
            current = current.getSuperclass();
        }
        return fields;
    }

    private boolean shouldTrack(Field field) {
        if (EXCLUDED_FIELDS.contains(field.getName())) return false;
        if (field.isAnnotationPresent(Transient.class)) return false;
        if (field.isAnnotationPresent(JsonIgnore.class) && !field.isAnnotationPresent(ManyToOne.class)) return false;
        if (Modifier.isStatic(field.getModifiers())) return false;
        if (Modifier.isFinal(field.getModifiers())) return false;
        if (field.isAnnotationPresent(OneToMany.class)) {
            OneToMany otm = field.getAnnotation(OneToMany.class);
            if (otm.mappedBy() != null && !otm.mappedBy().isEmpty()) return false;
        }
        return true;
    }

    private record FieldInfo(Field field, String name) {}
}
