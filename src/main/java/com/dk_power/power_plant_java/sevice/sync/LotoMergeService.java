package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.loto.Loto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Dedup merge service for Loto entities.
 * Transfers owned relationships (lotoBox, locks, snapshots) before soft-deleting duplicates.
 */
@Service
@Slf4j
public class LotoMergeService extends SharePointMergeTemplate<Loto> {

    public LotoMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "loto"; }
    @Override protected String entityName() { return "Loto"; }
    @Override protected Class<Loto> entityClass() { return Loto.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[Loto Merge]"; }

    @Override
    protected void markDeleted(Loto entity) {
        entity.setDeleted(true);
    }

    @Override
    protected void transferRelationships(Long duplicateId, Long canonicalId, String naturalKeyValue) {
        transferLotoBox(duplicateId, canonicalId);
        transferLocks(duplicateId, canonicalId);
        transferSnapshots(duplicateId, canonicalId);
    }

    private void transferLotoBox(Long duplicateId, Long canonicalId) {
        int updated = entityManager.createNativeQuery(
            "UPDATE loto SET loto_box_id = " +
            "(SELECT loto_box_id FROM loto WHERE id = :dupId) " +
            "WHERE id = :canId AND loto_box_id IS NULL " +
            "AND (SELECT loto_box_id FROM loto WHERE id = :dupId) IS NOT NULL")
            .setParameter("dupId", duplicateId)
            .setParameter("canId", canonicalId)
            .executeUpdate();
        if (updated > 0) {
            log.info("[Loto Merge] Transferred LotoBox link from ID={} to ID={}", duplicateId, canonicalId);
        }
    }

    private void transferLocks(Long duplicateId, Long canonicalId) {
        int updated = entityManager.createNativeQuery(
            "UPDATE lock SET loto_id = :canId WHERE loto_id = :dupId")
            .setParameter("canId", canonicalId)
            .setParameter("dupId", duplicateId)
            .executeUpdate();
        if (updated > 0) {
            log.info("[Loto Merge] Transferred {} Lock(s) from LOTO ID={} to ID={}", updated, duplicateId, canonicalId);
        }
    }

    private void transferSnapshots(Long duplicateId, Long canonicalId) {
        int updated = entityManager.createNativeQuery(
            "UPDATE loto_snapshot SET loto_id = :canId WHERE loto_id = :dupId")
            .setParameter("canId", canonicalId)
            .setParameter("dupId", duplicateId)
            .executeUpdate();
        if (updated > 0) {
            log.info("[Loto Merge] Transferred {} Snapshot(s) from LOTO ID={} to ID={}", updated, duplicateId, canonicalId);
        }
    }
}
