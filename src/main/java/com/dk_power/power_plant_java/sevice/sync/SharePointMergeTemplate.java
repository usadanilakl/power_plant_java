package com.dk_power.power_plant_java.sevice.sync;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
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
     * Detect and merge duplicate entities sharing the same natural key.
     * Temporarily clears SyncContext so dedup changes are tracked by
     * FieldChangeEntityListener and synced to other machines.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
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

    @SuppressWarnings("unchecked")
    private int runMerge() {
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT " + naturalKeyColumn() + ", COUNT(*) FROM " + tableName() +
            " WHERE deleted = false AND " + naturalKeyColumn() + " IS NOT NULL" +
            " GROUP BY " + naturalKeyColumn() + " HAVING COUNT(*) > 1")
            .getResultList();

        if (duplicates.isEmpty()) {
            log.debug("{} No duplicates found", logPrefix());
            return 0;
        }
        log.debug("{} Found {} groups with duplicates", logPrefix(), duplicates.size());

        int merged = 0;
        for (Object[] row : duplicates) {
            String keyValue = (String) row[0];
            int count = ((Number) row[1]).intValue();
            log.debug("{} key='{}' has {} copies", logPrefix(), keyValue, count);
            merged += mergeByKey(keyValue);
        }
        return merged;
    }

    private int mergeByKey(String keyValue) {
        List<E> entities = entityManager.createQuery(
            "SELECT e FROM " + entityName() + " e WHERE e." + jpaFieldName() +
            " = :key AND e.deleted = false ORDER BY e.id", entityClass())
            .setParameter("key", keyValue)
            .getResultList();

        if (entities.size() <= 1) return 0;

        E canonical = entities.get(0);
        Long canonicalId = getId(canonical);
        int merged = 0;

        for (int i = 1; i < entities.size(); i++) {
            E duplicate = entities.get(i);
            Long duplicateId = getId(duplicate);

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
