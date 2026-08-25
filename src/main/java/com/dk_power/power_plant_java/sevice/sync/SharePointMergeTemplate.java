package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Template for SharePoint-backed entity deduplication.
 * Finds entities with duplicate natural keys (typically sharepointId),
 * keeps the lowest-ID record (canonical, deterministic across all clients),
 * and soft-deletes the rest.
 * <p>
 * Subclasses provide: table name, entity class, natural key column,
 * and optional FK transfer logic via {@link #transferRelationships}.
 *
 * @param <E> the entity type
 */
@Slf4j
public abstract class SharePointMergeTemplate<E> {

    @PersistenceContext
    protected EntityManager entityManager;

    protected final SyncContext syncContext;

    /**
     * Field-injected (not constructor) so the ~11 subclasses don't all need their constructors
     * changed. Used only for the hub-only guard in {@link #mergeIfDuplicatesExist()}.
     */
    @Autowired
    protected SyncConfig syncConfig;

    protected SharePointMergeTemplate(SyncContext syncContext) {
        this.syncContext = syncContext;
    }

    /** Database table name for native SQL (e.g., "work_request"). */
    protected abstract String tableName();

    /** JPQL entity name (e.g., "WorkRequest"). */
    protected abstract String entityName();

    /** Entity class for typed JPQL queries. */
    protected abstract Class<E> entityClass();

    /** Native SQL column name for the natural key (e.g., "sharepoint_id"). */
    protected abstract String naturalKeyColumn();

    /** JPA field name for the natural key (e.g., "sharepointId"). */
    protected abstract String jpaFieldName();

    /** Log prefix (e.g., "[WorkRequest Merge]"). */
    protected abstract String logPrefix();

    /** Mark the entity as soft-deleted. */
    protected abstract void markDeleted(E entity);

    /**
     * Transfer FKs from duplicate to canonical before soft-deleting.
     * Default: no-op (leaf entities). Override for entities that own relationships.
     */
    protected void transferRelationships(Long duplicateId, Long canonicalId, String naturalKeyValue) {
        // No-op by default
    }

    /**
     * Additional natural keys to dedup on, beyond {@link #naturalKeyColumn()}. Default: just the single
     * primary key. Override to dedup on MULTIPLE independent keys (e.g. InstrumentLog: a sharepoint_id
     * collision AND a localUuid collision are different duplicate populations). Passes run sequentially;
     * a loser soft-deleted by an earlier pass is excluded from later passes by the {@code deleted=false} filter.
     */
    protected List<NaturalKeySpec> naturalKeys() {
        return List.of(new NaturalKeySpec(naturalKeyColumn(), jpaFieldName()));
    }

    /** A (nativeColumn, jpaField) pair identifying one dedup key. */
    public record NaturalKeySpec(String column, String field) {}

    /**
     * Choose which row of a duplicate group survives. {@code sorted} is ascending by id, so the DEFAULT —
     * smallest id — is deterministic across nodes (all nodes pick the same survivor). Override to prefer a
     * semantically richer row (e.g. an ACTIVE template, a COMPLETED submission, a classification-locked PM).
     * Return {@code null} to DECLINE merging this group entirely (leave all rows coexisting for admin
     * review) — use when auto-picking a survivor could silently discard real data.
     */
    protected E selectCanonical(List<E> sorted) {
        return sorted.get(0);
    }

    /**
     * Detect and merge duplicate entities sharing the same natural key.
     * Temporarily clears SyncContext so dedup changes are tracked by
     * FieldChangeEntityListener and synced to other machines.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
        // HUB-ONLY. sharepoint_id dedup is a NON-COMMUTATIVE decision (which row survives, which are
        // soft-deleted) and must run on exactly ONE authority. If desktops also ran it, two nodes with
        // different PARTIAL views (rows still arriving via sync) could each pick a different canonical
        // and soft-delete the OTHER's pick — competing deletes on DIFFERENT entity ids that LWW cannot
        // reconcile, so BOTH copies can end up deleted=true and the `WHERE deleted=false` scan never
        // sees the group again = permanent divergence / data loss (proven in the 3-node lab 2026-08-25;
        // see sync_emission_gap_audit_2026_08_24 memory). The hub is the single SP authority: it dedups
        // and the result (managed re-points + soft-deletes) syncs down. Desktops still fetch+import+
        // process SP items when the hub is down (that path is separate — SharePointSyncOrchestrator
        // executeSyncForType fetches/imports at :197-244, dedup only at :258-263); they just DEFER
        // dedup to the hub instead of each guessing independently.
        if (syncConfig == null || !syncConfig.isHubMode()) {
            log.debug("{} dedup skipped — not hub (single-authority dedup runs on the hub only)", logPrefix());
            return;
        }
        boolean wasSyncing = syncContext.isSyncing();
        if (wasSyncing) {
            syncContext.endSync();
        }
        try {
            int merged = runMerge();
            if (merged > 0) {
                log.info("{} {} duplicates deduplicated", logPrefix(), merged);
            }
        } finally {
            if (wasSyncing) {
                syncContext.startSync();
            }
        }
    }

    private int runMerge() {
        int merged = 0;
        for (NaturalKeySpec key : naturalKeys()) {
            merged += runMergeForKey(key.column(), key.field());
        }
        return merged;
    }

    @SuppressWarnings("unchecked")
    private int runMergeForKey(String column, String field) {
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT " + column + ", COUNT(*) FROM " + tableName() +
            " WHERE deleted = false AND " + column + " IS NOT NULL" +
            " GROUP BY " + column + " HAVING COUNT(*) > 1")
            .getResultList();

        if (duplicates.isEmpty()) return 0;
        log.debug("{} Found {} groups with duplicate {}", logPrefix(), duplicates.size(), column);

        int merged = 0;
        for (Object[] row : duplicates) {
            String keyValue = (String) row[0];
            merged += mergeByKey(field, keyValue);
        }
        return merged;
    }

    private int mergeByKey(String field, String keyValue) {
        List<E> entities = entityManager.createQuery(
            "SELECT e FROM " + entityName() + " e WHERE e." + field +
            " = :key AND e.deleted = false ORDER BY e.id", entityClass())
            .setParameter("key", keyValue)
            .getResultList();

        if (entities.size() <= 1) return 0;

        E canonical = selectCanonical(entities);
        if (canonical == null) {
            log.warn("{} key='{}' has {} copies but selectCanonical declined — leaving all for admin review",
                logPrefix(), keyValue, entities.size());
            return 0;
        }
        Long canonicalId = getId(canonical);
        int merged = 0;

        for (E duplicate : entities) {
            Long duplicateId = getId(duplicate);
            if (duplicateId.equals(canonicalId)) continue;

            transferRelationships(duplicateId, canonicalId, keyValue);

            markDeleted(duplicate);
            entityManager.merge(duplicate);
            entityManager.flush();
            merged++;

            log.debug("{} key='{}' ID={} merged into ID={}",
                logPrefix(), keyValue, duplicateId, canonicalId);
        }
        return merged;
    }

    @SuppressWarnings("unchecked")
    private Long getId(E entity) {
        try {
            return (Long) entity.getClass().getMethod("getId").invoke(entity);
        } catch (Exception e) {
            throw new RuntimeException("Cannot get ID from entity " + entity.getClass().getSimpleName(), e);
        }
    }
}
