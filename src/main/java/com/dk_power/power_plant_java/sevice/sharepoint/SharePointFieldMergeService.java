package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.SharePointSnapshot;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.SharePointSnapshotRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Field-level merge service for SharePoint sync.
 * Implements the same LWW (Last-Writer-Wins) strategy used for hub-peer sync,
 * but applied to SharePoint ↔ local entity field conflicts.
 * <p>
 * Uses a snapshot of last-seen SP values to detect which fields actually
 * changed on the SP side, then compares against local FieldChange records
 * to determine which side wins per field.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SharePointFieldMergeService {

    private final SharePointSnapshotRepository snapshotRepo;
    private final FieldChangeRepository fieldChangeRepo;
    private final ObjectMapper objectMapper;

    private static final TypeReference<Map<String, String>> MAP_TYPE = new TypeReference<>() {};

    /**
     * Identify which SP columns changed since last sync.
     * Compares current SP values against stored snapshot.
     *
     * @return set of SP column names that changed (all columns if first sync)
     */
    public Set<String> getSpChangedFields(String entityType, String sharepointId,
                                           Map<String, String> currentSpValues) {
        SharePointSnapshot snapshot = snapshotRepo
            .findByEntityTypeAndSharepointId(entityType, sharepointId)
            .orElse(null);

        if (snapshot == null) {
            // First sync for this entity — all fields are "new"
            return new HashSet<>(currentSpValues.keySet());
        }

        Map<String, String> oldValues = parseJson(snapshot.getFieldsJson());
        Set<String> changed = new HashSet<>();
        for (Map.Entry<String, String> entry : currentSpValues.entrySet()) {
            String oldVal = oldValues.get(entry.getKey());
            if (!Objects.equals(entry.getValue(), oldVal)) {
                changed.add(entry.getKey());
            }
        }
        return changed;
    }

    /**
     * For each SP-changed column, check if local has a newer FieldChange.
     * Uses the SP item's Modified datetime as the SP-side timestamp.
     *
     * @param entityType      entity type name (e.g., "WorkRequest")
     * @param entityId        local entity ID (null for new entities)
     * @param fieldMapping    map of entity field name → SP column name
     * @param spChangedColumns set of SP column names that changed
     * @param spModifiedTime  SP item's Modified datetime
     * @return set of ENTITY FIELD NAMES where SP should win (apply SP value)
     */
    public Set<String> resolveConflicts(String entityType, Long entityId,
                                         Map<String, String> fieldMapping,
                                         Set<String> spChangedColumns,
                                         Instant spModifiedTime) {
        // Invert: SP column → entity field
        Map<String, String> columnToField = new HashMap<>();
        fieldMapping.forEach((field, col) -> columnToField.put(col, field));

        Set<String> spWins = new HashSet<>();
        for (String spColumn : spChangedColumns) {
            String entityField = columnToField.get(spColumn);
            if (entityField == null) continue; // unmapped column, skip

            if (entityId == null) {
                spWins.add(entityField); // New entity, accept all
                continue;
            }

            // Find latest local FieldChange for this specific field
            Optional<FieldChange> latestLocal = fieldChangeRepo.findLatestChange(
                entityType, entityId, entityField);

            if (latestLocal.isEmpty() || latestLocal.get().getTimestamp().isBefore(spModifiedTime)) {
                spWins.add(entityField); // No local change or SP is newer
            } else {
                log.debug("[SP Field Merge] Local wins for {}.{} (local={}, sp={})",
                    entityType, entityField,
                    latestLocal.get().getTimestamp(), spModifiedTime);
            }
        }
        return spWins;
    }

    /**
     * Update the snapshot after sync. Always stores current SP values
     * regardless of which side won each field conflict.
     */
    public void updateSnapshot(String entityType, String sharepointId,
                                Map<String, String> currentSpValues) {
        SharePointSnapshot snapshot = snapshotRepo
            .findByEntityTypeAndSharepointId(entityType, sharepointId)
            .orElseGet(SharePointSnapshot::new);
        snapshot.setEntityType(entityType);
        snapshot.setSharepointId(sharepointId);
        snapshot.setFieldsJson(toJson(currentSpValues));
        snapshot.setLastSyncTime(Instant.now());
        snapshotRepo.save(snapshot);
    }

    // --- JSON helpers ---

    private Map<String, String> parseJson(String json) {
        if (json == null || json.isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (Exception e) {
            log.warn("[SP Field Merge] Failed to parse snapshot JSON: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private String toJson(Map<String, String> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.warn("[SP Field Merge] Failed to serialize snapshot: {}", e.getMessage());
            return "{}";
        }
    }
}
