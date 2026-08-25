package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.entities.loto.LotoSnapshot;
import com.dk_power.power_plant_java.entities.loto.Lock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

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
        // Loto.lotoBox is the INVERSE side of a @OneToOne OWNED by LotoBox.loto (FK column
        // loto_boxes.loto). The old "UPDATE loto SET loto_box_id" wrote a column that is not
        // part of the mapping — effectively a no-op. Re-point the OWNING side (LotoBox.loto)
        // via a managed save so the FK move emits a FieldChange (LotoBox is a tracked
        // BaseAuditEntity). Do NOT touch either Loto's inverse lotoBox reference: it has
        // orphanRemoval=true, so clearing it would DELETE the box on flush. Same guard as the
        // old SQL: only move the box when the canonical has none and the duplicate has one.
        Loto canonical = entityManager.find(Loto.class, canonicalId);
        if (canonical == null || canonical.getLotoBox() != null) return;
        Loto duplicate = entityManager.find(Loto.class, duplicateId);
        if (duplicate == null) return;
        LotoBox dupBox = duplicate.getLotoBox();
        if (dupBox == null) return;
        dupBox.setLoto(canonical);
        // Keep the cached inverse consistent so a SECOND boxed duplicate in the same natural-key
        // group sees canonical.getLotoBox() != null and is skipped — otherwise the guard above
        // reads a stale null every iteration and points multiple boxes at one Loto (unique-
        // constraint violation / NonUniqueResultException). null->box on the inverse does NOT
        // trigger orphanRemoval (that fires only on box->null removal), so this is safe.
        canonical.setLotoBox(dupBox);
        entityManager.merge(dupBox);
        log.info("[Loto Merge] Transferred LotoBox link from ID={} to ID={}", duplicateId, canonicalId);
    }

    private void transferLocks(Long duplicateId, Long canonicalId) {
        // Managed re-point so each Lock's loto FK change emits a FieldChange (Lock is a
        // tracked BaseAuditEntity — physical lock↔permit assignment). The old native bulk
        // UPDATE left desktops with Locks orphaned onto the soft-deleted duplicate LOTO.
        Loto canonical = entityManager.find(Loto.class, canonicalId);
        if (canonical == null) return;
        List<Lock> locks = entityManager.createQuery(
            "SELECT l FROM Lock l WHERE l.loto.id = :dupId", Lock.class)
            .setParameter("dupId", duplicateId)
            .getResultList();
        for (Lock lock : locks) {
            lock.setLoto(canonical);
            entityManager.merge(lock);
        }
        if (!locks.isEmpty()) {
            log.info("[Loto Merge] Transferred {} Lock(s) from LOTO ID={} to ID={}", locks.size(), duplicateId, canonicalId);
        }
    }

    private void transferSnapshots(Long duplicateId, Long canonicalId) {
        // Managed re-point so each LotoSnapshot's loto FK change emits a FieldChange
        // (LotoSnapshot is a tracked BaseAuditEntity).
        Loto canonical = entityManager.find(Loto.class, canonicalId);
        if (canonical == null) return;
        List<LotoSnapshot> snapshots = entityManager.createQuery(
            "SELECT s FROM LotoSnapshot s WHERE s.loto.id = :dupId", LotoSnapshot.class)
            .setParameter("dupId", duplicateId)
            .getResultList();
        for (LotoSnapshot s : snapshots) {
            s.setLoto(canonical);
            entityManager.merge(s);
        }
        if (!snapshots.isEmpty()) {
            log.info("[Loto Merge] Transferred {} Snapshot(s) from LOTO ID={} to ID={}", snapshots.size(), duplicateId, canonicalId);
        }
    }
}
