package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Sync-time dedup for {@link PhysicalObject} (natural key: maximoKey). Hub-only. The "informational binder"
 * hub: many domain entities point INTO it via a soft {@code physicalObjectId} FK. When two nodes seed the
 * same node independently, the loser must have EVERY referencer re-pointed to the canonical or its binder
 * links go silently dangling (UI shows "no equipment"). Re-points run through managed JPA saves so they
 * emit synced FieldChanges (origin converges). The self-referential {@code parent} FK is handled generically
 * by the apply-time idRemap resolution, so it needs no explicit pass here.
 *
 * <p>Canonical = smallest id (deterministic across nodes). NOTE: the loser's own locally-owned layout fields
 * (specificLocation, floorIndex, representation refs) are NOT copied onto the survivor — the same
 * loser-scalar tradeoff every merge type has; acceptable because those re-seed/re-author cheaply.
 */
@Service
@Slf4j
public class PhysicalObjectMergeService extends SharePointMergeTemplate<PhysicalObject> {

    public PhysicalObjectMergeService(SyncContext syncContext) { super(syncContext); }

    @Override protected String tableName() { return "physical_object"; }
    @Override protected String entityName() { return "PhysicalObject"; }
    @Override protected Class<PhysicalObject> entityClass() { return PhysicalObject.class; }
    @Override protected String naturalKeyColumn() { return "maximo_key"; }
    @Override protected String jpaFieldName() { return "maximoKey"; }
    @Override protected String logPrefix() { return "[PhysicalObject Merge]"; }
    @Override protected void markDeleted(PhysicalObject entity) { entity.setDeleted(true); }

    @Override
    protected void transferRelationships(Long duplicateId, Long canonicalId, String naturalKeyValue) {
        // Every entity that binds to a PhysicalObject via a plain Long physicalObjectId FK.
        repointLongFk("FileObject", "physicalObjectId", duplicateId, canonicalId);
        repointLongFk("WorkArea", "physicalObjectId", duplicateId, canonicalId);
        repointLongFk("LotoPoint", "physicalObjectId", duplicateId, canonicalId);
        repointLongFk("RoundIssue", "physicalObjectId", duplicateId, canonicalId);
        repointLongFk("RoundQuestion", "physicalObjectId", duplicateId, canonicalId);
        // DiagramPlacement binds polymorphically: sourceEntityId + sourceEntityType='PhysicalObject'.
        List<?> dps = entityManager.createQuery(
                "SELECT e FROM DiagramPlacement e WHERE e.sourceEntityId = :dup AND e.sourceEntityType = 'PhysicalObject'")
                .setParameter("dup", duplicateId).getResultList();
        for (Object dp : dps) {
            try {
                dp.getClass().getMethod("setSourceEntityId", Long.class).invoke(dp, canonicalId);
                entityManager.merge(dp);
            } catch (Exception e) {
                log.warn("{} DiagramPlacement repoint failed for {}: {}", logPrefix(), duplicateId, e.getMessage());
            }
        }
        if (!dps.isEmpty()) {
            log.info("{} repointed {} DiagramPlacement(s) {}->{}", logPrefix(), dps.size(), duplicateId, canonicalId);
        }
    }

    /** Load every {@code entityName} whose Long {@code field} == duplicateId, set it to canonicalId, managed-save (emits). */
    private void repointLongFk(String entityName, String field, Long duplicateId, Long canonicalId) {
        List<?> rows = entityManager.createQuery(
                "SELECT e FROM " + entityName + " e WHERE e." + field + " = :dup")
                .setParameter("dup", duplicateId).getResultList();
        if (rows.isEmpty()) return;
        String setter = "set" + Character.toUpperCase(field.charAt(0)) + field.substring(1);
        for (Object row : rows) {
            try {
                row.getClass().getMethod(setter, Long.class).invoke(row, canonicalId);
                entityManager.merge(row);
            } catch (Exception e) {
                log.warn("{} {} repoint failed for {}: {}", logPrefix(), entityName, duplicateId, e.getMessage());
            }
        }
        log.info("{} repointed {} {}(s) {}->{}", logPrefix(), rows.size(), entityName, duplicateId, canonicalId);
    }
}
