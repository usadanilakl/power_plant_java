package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Pre-save dedup resolver. Before creating an entity via sync, checks if an entity
 * with the same natural key already exists in the database.
 *
 * Natural keys are defined per entity type (extracted from existing merge services).
 * Entity types without a natural key pass through unchanged — they don't get duplicated
 * because they're only created on one machine and synced to others.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DedupKeyResolver {

    @PersistenceContext
    private EntityManager entityManager;

    private final EntityTableRegistry entityTableRegistry;

    /**
     * Describes one field in a natural key.
     */
    private record NaturalKeyField(
        String fieldName,       // FieldChange.fieldName (e.g., "windowsUsername", "name", "category")
        String columnName,      // DB column name (e.g., "windows_username", "name", "category_id")
        boolean isRelationship, // true if this is a ManyToOne FK (value is an entity ID)
        boolean caseSensitive   // false = LOWER() comparison
    ) {}

    /**
     * Natural key definitions per entity type.
     * Only entity types that can be independently created on multiple machines need entries.
     */
    private static final Map<String, List<NaturalKeyField>> NATURAL_KEYS = Map.ofEntries(
        Map.entry("User",                List.of(new NaturalKeyField("windowsUsername", "windows_username", false, false))),
        Map.entry("Category",            List.of(new NaturalKeyField("name", "name", false, false))),
        Map.entry("Value",               List.of(new NaturalKeyField("name", "name", false, false),
                                                  new NaturalKeyField("category", "category_id", true, true))),
        Map.entry("WorkRequest",         List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("Jha",                 List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("EmailCorrespondence", List.of(new NaturalKeyField("graphMessageId", "graph_message_id", false, true))),
        Map.entry("SafeWork",            List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("HotWork",             List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("ConfinedSpace",       List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("Loto",                List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("EnergizedWorkPermit", List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("ExcavationPermit",    List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("VentingPermit",       List.of(new NaturalKeyField("sharepointId", "sharepoint_id", false, true))),
        Map.entry("Instrument",          List.of(new NaturalKeyField("tagNumber", "tag_number", false, false))),
        Map.entry("RecurringPm",         List.of(new NaturalKeyField("pmKey", "pm_key", false, true))),
        Map.entry("InstrumentLog",       List.of(new NaturalKeyField("localUuid", "local_uuid", false, true))),
        Map.entry("Conversation",        List.of(new NaturalKeyField("entityType", "entity_type", false, true),
                                                  new NaturalKeyField("entityId", "entity_id", false, true),
                                                  new NaturalKeyField("initiatorId", "initiator_id", false, true),
                                                  new NaturalKeyField("subject", "subject", false, true)))
    );

    /**
     * Find an existing entity by natural key. Returns the existing entity's ID, or null
     * if no duplicate exists (or if the entity type has no natural key defined).
     *
     * @param entityType     the entity type name (e.g., "User", "Value")
     * @param incomingId     the ID of the incoming entity (excluded from results)
     * @param changes        the incoming FieldChanges for this entity
     * @param idRemapTable   in-batch remap table for cascading FK resolution
     * @return existing entity ID if duplicate found, null otherwise
     */
    public Long findExistingByNaturalKey(String entityType, Long incomingId,
                                          List<FieldChange> changes,
                                          Map<String, Map<Long, Long>> idRemapTable) {
        List<NaturalKeyField> keyFields = NATURAL_KEYS.get(entityType);
        if (keyFields == null) {
            return null; // No natural key defined — not a dedup candidate
        }

        String tableName = entityTableRegistry.getTableName(entityType);
        if (tableName == null) {
            log.warn("No table mapping for entity type {}", entityType);
            return null;
        }
        tableName = tableName.toUpperCase();

        // Build WHERE clause from natural key fields
        StringBuilder where = new StringBuilder();
        Object[] paramValues = new Object[keyFields.size()];

        for (int i = 0; i < keyFields.size(); i++) {
            NaturalKeyField keyField = keyFields.get(i);

            // Find the FieldChange that provides this key field's value
            String fieldValue = findFieldValue(keyField.fieldName, changes);
            if (fieldValue == null) {
                log.debug("Natural key field '{}' not found in changes for {}#{} — skipping dedup",
                    keyField.fieldName, entityType, incomingId);
                return null; // Can't check dedup without all key fields
            }

            // For relationship fields, the value is an entity ID — check remap table
            if (keyField.isRelationship) {
                try {
                    Long fkId = Long.parseLong(fieldValue.replace("\"", "").trim());
                    // Check if the referenced entity was remapped in this batch
                    if (idRemapTable != null) {
                        // For FK natural key fields, we need to figure out the referenced entity type.
                        // Convention: the fieldName IS the entity type in lowercase (e.g., "category" -> "Category")
                        String refType = capitalize(keyField.fieldName);
                        Map<Long, Long> typeRemaps = idRemapTable.get(refType);
                        if (typeRemaps != null && typeRemaps.containsKey(fkId)) {
                            Long remappedId = typeRemaps.get(fkId);
                            log.debug("Dedup: remapped FK {}.{} from {} to {} (in-batch remap)",
                                entityType, keyField.fieldName, fkId, remappedId);
                            fkId = remappedId;
                        }
                    }
                    paramValues[i] = fkId;
                } catch (NumberFormatException e) {
                    log.debug("Could not parse FK value '{}' for {}.{} — skipping dedup",
                        fieldValue, entityType, keyField.fieldName);
                    return null;
                }
            } else {
                // Plain string value
                paramValues[i] = fieldValue.replace("\"", "").trim();
            }

            if (i > 0) where.append(" AND ");
            if (keyField.caseSensitive || keyField.isRelationship) {
                where.append(keyField.columnName).append(" = ?").append(i + 1);
            } else {
                where.append("LOWER(").append(keyField.columnName).append(") = LOWER(?").append(i + 1).append(")");
            }
        }

        // Query for existing entity with same natural key
        String sql = "SELECT id FROM " + tableName +
            " WHERE " + where +
            " AND deleted = false" +
            " AND id != ?" + (keyFields.size() + 1) +
            " ORDER BY id ASC";

        try {
            var query = entityManager.createNativeQuery(sql);
            for (int i = 0; i < paramValues.length; i++) {
                query.setParameter(i + 1, paramValues[i]);
            }
            query.setParameter(keyFields.size() + 1, incomingId);
            query.setMaxResults(1);

            @SuppressWarnings("unchecked")
            List<Object> results = query.getResultList();
            if (!results.isEmpty()) {
                Long existingId = ((Number) results.get(0)).longValue();
                log.debug("Dedup match: {}#{} has same natural key as existing #{}", entityType, incomingId, existingId);
                return existingId;
            }
        } catch (Exception e) {
            log.warn("Dedup query failed for {}#{}: {}", entityType, incomingId, e.getMessage());
        }

        return null;
    }

    /**
     * Resolve a remapped entity ID. Returns the canonical ID if a remap exists,
     * or the original ID if no remap is recorded.
     */
    public static Long resolveRemappedId(String entityType, Long id, Map<String, Map<Long, Long>> idRemapTable) {
        if (idRemapTable == null || id == null) return id;
        Map<Long, Long> typeRemaps = idRemapTable.get(entityType);
        if (typeRemaps != null && typeRemaps.containsKey(id)) {
            return typeRemaps.get(id);
        }
        return id;
    }

    /**
     * Find a field's new value from a list of FieldChanges.
     */
    private String findFieldValue(String fieldName, List<FieldChange> changes) {
        for (FieldChange change : changes) {
            if (fieldName.equals(change.getFieldName()) && change.getNewValue() != null) {
                return change.getNewValue();
            }
        }
        return null;
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
