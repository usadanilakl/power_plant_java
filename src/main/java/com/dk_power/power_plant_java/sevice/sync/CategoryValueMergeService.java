package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Sync-time dedup for {@link Category} and {@link Value} duplicates that came in
 * via field-change sync. Runs on the hub only (clients receive the resulting
 * merges via sync; running dedup on both sides causes conflicting decisions —
 * hub keeps A, client keeps B, both delete the other's pick).
 *
 * <p>Scope: <b>within-category duplicates only</b>. Cross-category orphan
 * resolution is admin-only — auto-merging across categories could turn a
 * divergent rename into silent data loss.
 *
 * <p>Mutation pattern (hybrid, per dedup spec):
 * <ul>
 *   <li>Native SQL for read-only safety checks — discovery via JPA metamodel,
 *       filtered against {@code INFORMATION_SCHEMA}; COUNT of references via
 *       direct SQL, bypassing {@code @Where(deleted IS NOT TRUE)}.</li>
 *   <li>JPA mutation for the actual repoint — scalar {@code @ManyToOne Value}
 *       fields fire {@code @PostUpdate} on flush; {@code @ManyToMany Set<Value>}
 *       fields do NOT (Hibernate only updates the join table), so
 *       {@link ValueReferenceRepointService} also emits a synthetic
 *       {@code FieldChange} for collection mutations.</li>
 *   <li>{@code entityManager.flush()} between repoint and verify-before-delete
 *       so the post-count reads the committed state, not the stale pre-mutation
 *       DB state.</li>
 *   <li>Fail-loud: any exception during the repoint surfaces (no silent
 *       {@code return 1} masking schema/reflection drift). See
 *       {@link FieldSyncService} for the wrapper that catches contention only.</li>
 * </ul>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryValueMergeService {

    private final SyncContext syncContext;
    private final ValueReferenceRepointService valueReferenceRepointService;
    private final PlatformTransactionManager transactionManager;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Wraps each Value/Category merge pair in its own REQUIRES_NEW transaction
     * so that pair-level failures (count probe blowing up, synthetic FieldChange
     * emission returning empty, soft-delete throwing) roll back ONLY that pair's
     * repoint + synthetic FieldChange rows. Other already-merged pairs in the
     * same {@link #mergeIfDuplicatesExist()} run stay committed.
     */
    private TransactionTemplate perPairTxTemplate;

    @PostConstruct
    void initPerPairTxTemplate() {
        this.perPairTxTemplate = new TransactionTemplate(transactionManager);
        this.perPairTxTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Detect and merge duplicate Categories and Values.
     * Called after a sync batch is applied (in afterCommit callback) and at hub boot.
     *
     * <p>Temporarily clears {@link SyncContext} because dedup runs on the sync
     * thread where {@code isSyncing()} is still true. Dedup mutations are LOCAL
     * changes that must be tracked by {@link FieldChangeEntityListener} and
     * synced to other machines — without clearing, the listener skips them.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
        boolean wasSyncing = syncContext.isSyncing();
        if (wasSyncing) {
            syncContext.endSync();
        }
        // Each pair runs in its own REQUIRES_NEW tx (so failure isolates), but
        // we still need to surface those failures upward. Accumulate them and
        // rethrow at the end so FieldSyncService.runMergeCascade treats the run
        // as a real fault (log.error + rethrow, not swallowed as contention).
        List<Exception> pairFailures = new ArrayList<>();
        try {
            int mergedCategories = mergeCategories(pairFailures);
            int mergedValues = mergeValues(pairFailures);

            if (mergedCategories > 0 || mergedValues > 0) {
                log.info("Merge complete: {} categories, {} values deduplicated",
                    mergedCategories, mergedValues);
            }
        } finally {
            if (wasSyncing) {
                syncContext.startSync();
            }
        }

        if (!pairFailures.isEmpty()) {
            // Throw an aggregate. The first cause is preserved; all suppressed
            // failures are attached so the operator gets the full picture from
            // a single stack trace.
            PairFailureAggregateException agg = new PairFailureAggregateException(pairFailures);
            log.error("mergeIfDuplicatesExist: {} pair failure(s) accumulated — rethrowing aggregate so FieldSyncService can surface", pairFailures.size(), agg);
            throw agg;
        }
    }

    /**
     * Aggregates per-pair failures that occurred during a single
     * {@link #mergeIfDuplicatesExist()} run. Carries the first failure as its
     * direct cause and the rest as suppressed exceptions so all context is in
     * one stack trace.
     */
    public static final class PairFailureAggregateException extends RuntimeException {
        public PairFailureAggregateException(List<Exception> failures) {
            super(failures.size() + " dedup pair(s) failed: first=" + failures.get(0).getMessage(),
                    failures.get(0));
            for (int i = 1; i < failures.size(); i++) {
                addSuppressed(failures.get(i));
            }
        }
    }

    // ── Category dedup ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private int mergeCategories(List<Exception> pairFailures) {
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT LOWER(name), COUNT(*) FROM category WHERE deleted = false " +
            "GROUP BY LOWER(name) HAVING COUNT(*) > 1")
            .getResultList();

        int merged = 0;
        for (Object[] row : duplicates) {
            String name = (String) row[0];
            merged += mergeCategoriesByName(name, pairFailures);
        }
        return merged;
    }

    private int mergeCategoriesByName(String name, List<Exception> pairFailures) {
        List<Category> initialCategories = entityManager.createQuery(
            "SELECT c FROM Category c WHERE LOWER(c.name) = LOWER(:name) AND c.deleted = false ORDER BY c.id",
            Category.class)
            .setParameter("name", name)
            .getResultList();

        if (initialCategories.size() <= 1) return 0;

        Long canonicalId = initialCategories.get(0).getId();
        int merged = 0;

        // Discover Category FK columns once — used by verify-before-delete.
        Map<String, List<String>> categoryFkColumns = valueReferenceRepointService.discoverCategoryFkColumns();

        for (int i = 1; i < initialCategories.size(); i++) {
            Long duplicateId = initialCategories.get(i).getId();

            try {
                // Each Category pair runs in its own REQUIRES_NEW transaction so
                // a verify-before-delete failure on one pair doesn't roll back
                // other already-merged pairs. The outer mergeIfDuplicatesExist
                // tx is suspended for the duration.
                Boolean wasMerged = perPairTxTemplate.execute(status -> {
                    // Re-fetch in the new tx so the entities are managed here.
                    Category dup = entityManager.find(Category.class, duplicateId);
                    Category canon = entityManager.find(Category.class, canonicalId);
                    if (dup == null || canon == null) return Boolean.FALSE;

                    List<Value> values = entityManager.createQuery(
                        "SELECT v FROM Value v WHERE v.category.id = :catId AND v.deleted = false",
                        Value.class)
                        .setParameter("catId", duplicateId)
                        .getResultList();

                    for (Value value : values) {
                        value.setCategory(canon);
                        entityManager.merge(value);
                    }

                    entityManager.flush();

                    // The JPA move above only touches ACTIVE values (@Where(deleted=false) hides
                    // soft-deleted ones from the query), but verify-before-delete counts ALL rows via
                    // native SQL — so a soft-deleted value still carrying the dup category_id (e.g. a
                    // value that was itself merged earlier) counts as a dangling reference and aborts the
                    // whole category merge forever. Repoint those soft-deleted stragglers too, via native
                    // SQL: a deleted value carries no synced state that matters, so no FieldChange emission
                    // is needed — this only preserves the invariant "no value references a dead category".
                    entityManager.createNativeQuery(
                        "UPDATE val_table SET category_id = :canon WHERE category_id = :dup AND deleted = true")
                        .setParameter("canon", canonicalId)
                        .setParameter("dup", duplicateId)
                        .executeUpdate();
                    entityManager.flush();

                    long remaining = valueReferenceRepointService.countReferencesByFkMap(
                            duplicateId, categoryFkColumns);
                    if (remaining > 0) {
                        Map<String, Long> breakdown = valueReferenceRepointService
                                .countReferencesByLocationByFkMap(duplicateId, categoryFkColumns);
                        log.error("Category merge: '{}' ID={} still has {} reference(s) after moving values; rolling back pair. Locations: {}",
                                name, duplicateId, remaining, breakdown);
                        // Roll the pair tx back. Without this, the Value.category
                        // moves already flushed in this tx would commit while the
                        // duplicate Category stays alive — leaving any non-Value
                        // FK pointing at the duplicate Category in a half-merged
                        // state. Mirror the Value path: log breakdown, rollback,
                        // surface as a pair failure so the aggregate rethrows.
                        pairFailures.add(new IllegalStateException(
                                "Category merge aborted for '" + name + "' ID=" + duplicateId
                                        + ": " + remaining + " reference(s) still point at duplicate. Locations: " + breakdown));
                        status.setRollbackOnly();
                        return Boolean.FALSE;
                    }

                    dup.setDeleted(true);
                    entityManager.merge(dup);
                    entityManager.flush();

                    valueReferenceRepointService.persistDedupRemap("Category", duplicateId, canonicalId);
                    log.info("Category merge: '{}' ID={} merged into ID={}, {} value(s) re-pointed",
                        name, duplicateId, canonicalId, values.size());
                    return Boolean.TRUE;
                });
                if (Boolean.TRUE.equals(wasMerged)) merged++;
            } catch (Exception e) {
                log.error("Category merge: pair {}→{} (name='{}') failed; this pair rolled back, continuing with others",
                        duplicateId, canonicalId, name, e);
                pairFailures.add(e);
            }
        }

        return merged;
    }

    // ── Value dedup ─────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private int mergeValues(List<Exception> pairFailures) {
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT LOWER(name), category_id, COUNT(*) FROM val_table " +
            "WHERE deleted = false AND category_id IS NOT NULL " +
            "GROUP BY LOWER(name), category_id HAVING COUNT(*) > 1")
            .getResultList();

        int merged = 0;
        // Discover once for all Value merges in this run — covers scalar
        // @ManyToOne Value FK columns AND @ManyToMany Set<Value> join tables.
        ValueReferenceRepointService.Metadata refMeta = valueReferenceRepointService.discover();

        for (Object[] row : duplicates) {
            String name = (String) row[0];
            Long categoryId = ((Number) row[1]).longValue();
            merged += mergeValuesByNameAndCategory(name, categoryId, refMeta, pairFailures);
        }
        return merged;
    }

    private int mergeValuesByNameAndCategory(String name, Long categoryId,
                                             ValueReferenceRepointService.Metadata refMeta,
                                             List<Exception> pairFailures) {
        List<Value> values = entityManager.createQuery(
            "SELECT v FROM Value v WHERE LOWER(v.name) = LOWER(:name) " +
            "AND v.category.id = :catId AND v.deleted = false ORDER BY v.id",
            Value.class)
            .setParameter("name", name)
            .setParameter("catId", categoryId)
            .getResultList();

        if (values.size() <= 1) return 0;

        Long canonicalId = values.get(0).getId();
        int merged = 0;

        for (int i = 1; i < values.size(); i++) {
            Long dupId = values.get(i).getId();

            try {
                // Run each value pair in its own REQUIRES_NEW tx. The JPA
                // repoint AND the synthetic FieldChange emission both join
                // this pair tx (the latter via
                // FieldChangeTracker.trackEntityUpdateInCurrentTx, propagation
                // MANDATORY). If anything inside throws — count probe failure,
                // synthetic emission returning empty, soft-delete throwing —
                // the whole pair rolls back: no leaked FieldChange rows, no
                // half-applied repoint. Other pairs in the run remain committed.
                Boolean wasMerged = perPairTxTemplate.execute(status -> {
                    Value dup = entityManager.find(Value.class, dupId);
                    Value canon = entityManager.find(Value.class, canonicalId);
                    if (dup == null || canon == null) return Boolean.FALSE;

                    ValueReferenceRepointService.RepointOutcome outcome =
                            valueReferenceRepointService.repointAllReferences(dupId, canon, refMeta);

                    entityManager.flush();

                    // Synthetic FieldChange emission inside this pair tx.
                    // Tracker uses MANDATORY propagation so rows join the tx;
                    // if any entry returns empty or throws, the whole pair
                    // rolls back including all earlier emissions.
                    valueReferenceRepointService.emitPendingFieldChanges(
                            outcome.pendingCollectionFieldChanges);

                    long remaining = valueReferenceRepointService.countReferencesSql(dupId, refMeta);
                    if (remaining > 0) {
                        Map<String, Long> breakdown = valueReferenceRepointService
                                .countReferencesByLocationSql(dupId, refMeta);
                        log.error("Value merge: '{}' (cat={}) ID={} still has {} reference(s) after repoint; refusing to delete. Locations: {}",
                                name, categoryId, dupId, remaining, breakdown);
                        // Surface the aborted pair so the aggregate at the end
                        // of mergeIfDuplicatesExist rethrows. Without this,
                        // verify-before-delete aborts would silently disappear
                        // from logs aggregation — operator sees the warn but
                        // FieldSyncService.runMergeCascade never knows the
                        // batch had failures.
                        pairFailures.add(new IllegalStateException(
                                "Value merge aborted for '" + name + "' (cat=" + categoryId + ") ID=" + dupId
                                        + ": " + remaining + " reference(s) still point at duplicate. Locations: " + breakdown));
                        // Mark the pair tx rollback-only so the JPA repoint
                        // AND the synthetic FieldChanges all unwind together.
                        // Without rollback, the hub would commit a partial
                        // dedup state that clients can't reconcile.
                        status.setRollbackOnly();
                        return Boolean.FALSE;
                    }

                    dup.setDeleted(true);
                    entityManager.merge(dup);
                    entityManager.flush();

                    valueReferenceRepointService.persistDedupRemap("Value", dupId, canonicalId);
                    log.info("Value merge: '{}' (cat={}) ID={} merged into ID={} ({} owner row(s) repointed)",
                        name, categoryId, dupId, canonicalId, outcome.ownerRowsTouched);
                    return Boolean.TRUE;
                });
                if (Boolean.TRUE.equals(wasMerged)) merged++;
            } catch (Exception e) {
                // Pair-level failure — this pair already rolled back via the
                // REQUIRES_NEW tx, no synthetic FieldChange leaked to clients.
                // Log loud, queue the failure for the aggregate rethrow at the
                // end of mergeIfDuplicatesExist, and continue with other pairs.
                log.error("Value merge: pair {}→{} (name='{}', cat={}) failed; this pair rolled back, continuing with others",
                        dupId, canonicalId, name, categoryId, e);
                pairFailures.add(e);
            }
        }

        return merged;
    }

}
