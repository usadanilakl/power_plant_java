package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.*;

/**
 * One-shot self-heal for Category/Value duplicate divergence created BEFORE the deterministic pre-save
 * path ({@code sync.dedup.deterministic-convergence.enabled}) was turned on.
 *
 * <p><b>The bug it heals</b> (confirmed in the 3-node lab, 2026-08-09): two nodes that independently
 * created the same-named Category/Value while partitioned each kept their OWN survivor (different
 * device-prefixed ids) because the pre-save dedup ({@link FieldSyncService} → {@link DedupKeyResolver})
 * redirected the incoming CREATE onto whatever row the node already had — recording the decision only in
 * {@code dedup_id_remap} (native, unsynced). The cluster settled at opposite fixed points, idle forever.
 *
 * <p><b>HUB-ONLY.</b> Like {@link CategoryValueMergeService} (afterCommit) and {@code StartupMergeRunner},
 * this runs on the hub only. The merge's verify-before-delete counts references in the LOCAL DB; only the
 * hub holds the complete reference set. A client with a partial replica could soft-delete a duplicate whose
 * references live on the hub / other clients, and that DELETE would propagate and orphan them. Clients
 * receive the convergence via normal sync.
 *
 * <p><b>The signal</b>: a <i>wrong-direction</i> entry in this hub's {@code dedup_id_remap} —
 * {@code original_id < remapped_id} — means the hub redirected a SMALLER id onto a LARGER one, i.e. it kept
 * the larger id as survivor when the deterministic rule says the smallest id must win.
 *
 * <p><b>Distinguishing the bug from a deliberate merge</b>: {@code dedup_id_remap} is also written by the
 * admin orphan-dedup tool ({@code CategoryValueManagerService.dedupOrphans}), which picks the survivor by
 * category membership — legitimately producing {@code original_id < remapped_id}. Those must NOT be
 * reversed. The discriminator: the buggy pre-save redirect NEVER inserted the smaller id (redirected
 * pre-insert → the row is ABSENT), whereas the admin/merge path SOFT-DELETES its loser (the row EXISTS with
 * {@code deleted=true}). So we act only when the smaller-id row is genuinely absent, and we never resurrect
 * an existing (even soft-deleted) row.
 *
 * <p><b>The heal</b>: for each qualifying wrong-direction entry, re-create the absent smaller-id row from
 * the surviving larger row's fields (so both coexist), then run the existing, tested deterministic merge
 * ({@link CategoryValueMergeService#mergeIfDuplicatesExist()}) — which picks the smallest id, repoints
 * references (verify-before-delete, complete on the hub), soft-deletes the loser, and emits SYNCED
 * FieldChanges every other node applies. Idempotent: re-running finds nothing once converged.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NaturalKeyDivergenceReconciler {

    private final SyncContext syncContext;
    private final CategoryValueMergeService categoryValueMergeService;
    private final PlatformTransactionManager transactionManager;
    private final SyncConfig syncConfig;

    @PersistenceContext
    private EntityManager entityManager;

    /** Entity types this reconciler heals, mapped to their class (scoped to the confirmed-diverging types). */
    private static final Map<String, Class<? extends BaseIdEntity>> TYPES = Map.of(
        "Category", Category.class,
        "Value", Value.class);

    /** Physical table per type — used for native existence/deleted probes that bypass {@code @Where(deleted=false)}. */
    private static final Map<String, String> TABLES = Map.of(
        "Category", "category",
        "Value", "val_table");

    /**
     * Fields NOT copied when reconstructing the smaller-id survivor: identity, soft-delete flag, audit
     * timestamps/actors, the class discriminator, and refactorNotes (a legitimately node-divergent field
     * appended under sync context). Everything else (name, category FK, aliases, flags…) is copied so the
     * re-created survivor carries the loser's data — no field-level loss when the merge keeps it.
     */
    private static final Set<String> SKIP_FIELDS = Set.of(
        "id", "deleted", "dateCreated", "dateModified", "createdBy", "modifiedBy",
        "objectType", "refactorNotes", "version");

    public record ReconcileResult(boolean ranOnHub, int recreated, int wrongEntriesSeen, int remapsCleaned) {}

    /**
     * Scan this HUB's {@code dedup_id_remap} for wrong-direction Category/Value entries, force the absent
     * smaller-id survivor to coexist, run the deterministic merge to converge + emit synced changes, then
     * clean up the now-inverted remap entries for pairs that actually converged.
     */
    public ReconcileResult reconcile() {
        if (!syncConfig.isHubMode()) {
            log.warn("reconcile: refused — natural-key divergence reconcile runs on the HUB only (the hub holds "
                + "the complete reference set; a client's partial replica would tombstone duplicates whose "
                + "references live elsewhere, orphaning them). No-op on this node.");
            return new ReconcileResult(false, 0, 0, 0);
        }

        int recreated = 0, seen = 0, cleaned = 0;

        TransactionTemplate reqNew = new TransactionTemplate(transactionManager);
        reqNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        for (Map.Entry<String, Class<? extends BaseIdEntity>> te : TYPES.entrySet()) {
            String type = te.getKey();
            Class<? extends BaseIdEntity> clazz = te.getValue();
            String table = TABLES.get(type);

            for (Object[] row : wrongDirectionRemaps(type)) {
                seen++;
                Long smallerId = ((Number) row[0]).longValue();   // original_id — the correct (smallest) survivor
                Long largerId  = ((Number) row[1]).longValue();   // remapped_id — the wrongly-kept survivor
                try {
                    Integer outcome = reqNew.execute(status -> forceCoexist(clazz, table, smallerId, largerId));
                    if (outcome != null && outcome == 1) recreated++;
                } catch (Exception e) {
                    log.error("reconcile: {} pair smaller={} larger={} — force-coexist failed, skipping: {}",
                        type, smallerId, largerId, e.getMessage(), e);
                }
            }
        }

        // Both rows now coexist wherever a heal was needed; the tested deterministic merge converges them
        // (smallest-id wins) and emits synced tombstone+repoint. Its own REQUIRES_NEW tx clears SyncContext
        // so the mutations are tracked + synced. A PairFailureAggregateException means some pair couldn't
        // fully repoint — the conditional cleanup below then leaves that pair's remap intact.
        try {
            categoryValueMergeService.mergeIfDuplicatesExist();
        } catch (Exception e) {
            log.error("reconcile: deterministic merge reported failures (some pairs may not have converged): {}",
                e.getMessage());
        }

        // Clean up ONLY the wrong-direction entries whose pair actually converged (larger now soft-deleted).
        // A converged pair's stale (smaller→larger) remap is now backwards and must go so a future incoming
        // reference to the live smaller id is not mis-resolved to the dead larger id. Pairs that did NOT
        // converge (merge aborted) keep their remap so a later run can retry.
        for (Map.Entry<String, Class<? extends BaseIdEntity>> te : TYPES.entrySet()) {
            String type = te.getKey();
            String table = TABLES.get(type);
            cleaned += reqNew.execute(status -> cleanupConvergedRemaps(type, table));
        }

        ReconcileResult result = new ReconcileResult(true, recreated, seen, cleaned);
        log.info("reconcile: complete — {}", result);
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> wrongDirectionRemaps(String type) {
        return entityManager.createNativeQuery(
            "SELECT original_id, remapped_id FROM dedup_id_remap " +
            "WHERE entity_type = :type AND original_id < remapped_id")
            .setParameter("type", type)
            .getResultList();
    }

    private int cleanupConvergedRemaps(String type, String table) {
        int cleaned = 0;
        for (Object[] row : wrongDirectionRemaps(type)) {
            Long smallerId = ((Number) row[0]).longValue();
            Long largerId  = ((Number) row[1]).longValue();
            if (rowExistsDeleted(table, largerId)) {   // larger tombstoned => this pair converged
                cleaned += entityManager.createNativeQuery(
                    "DELETE FROM dedup_id_remap WHERE entity_type = :t AND original_id = :o AND remapped_id = :r")
                    .setParameter("t", type).setParameter("o", smallerId).setParameter("r", largerId)
                    .executeUpdate();
            }
        }
        return cleaned;
    }

    /**
     * Ensure the smaller-id row exists and is active so the deterministic merge can pick it. Acts ONLY when
     * the smaller-id row is genuinely ABSENT (the buggy-redirect signature) — never resurrects an existing
     * (active or soft-deleted) row, so a deliberate admin/merge decision is left untouched. Runs with
     * {@link SyncContext} cleared so the CREATE it makes is tracked by the FieldChangeEntityListener and
     * synced. Returns 1 = re-created, 0 = no-op.
     */
    private int forceCoexist(Class<? extends BaseIdEntity> clazz, String table, Long smallerId, Long largerId) {
        BaseIdEntity larger = entityManager.find(clazz, largerId);
        if (larger == null || Boolean.TRUE.equals(larger.getDeleted())) {
            // The wrongly-kept survivor is already gone (another heal reached us, or it was deleted). Nothing
            // to reconstruct against; cleanup handles the stale remap.
            return 0;
        }
        // Native existence probe bypasses @Where(deleted=false): if the smaller id EXISTS in any state it was
        // NOT dropped by the buggy pre-save redirect (which never inserted it) — it's an admin/merge loser or
        // already-present row. Hands off.
        if (rowExists(table, smallerId)) {
            return 0;
        }

        boolean wasSyncing = syncContext.isSyncing();
        if (wasSyncing) syncContext.endSync();
        try {
            BaseIdEntity fresh = clazz.getDeclaredConstructor().newInstance();
            copyDataFields(larger, fresh);
            fresh.setId(smallerId);
            fresh.setDeleted(false);
            // merge (not persist): with a pre-assigned id not yet in the DB, Hibernate inserts it — the
            // proven create pattern here. DevicePrefixedIdGenerator preserves the pre-set id; @PostPersist
            // fires so the FieldChangeEntityListener emits a synced CREATE.
            entityManager.merge(fresh);
            entityManager.flush();
            log.info("reconcile: re-created {} #{} from #{}'s fields to coexist (deterministic survivor)",
                clazz.getSimpleName(), smallerId, largerId);
            return 1;
        } catch (Exception e) {
            throw new RuntimeException("forceCoexist " + clazz.getSimpleName()
                + " smaller=" + smallerId + " larger=" + largerId + " failed", e);
        } finally {
            if (wasSyncing) syncContext.startSync();
        }
    }

    private boolean rowExists(String table, Long id) {
        Number n = (Number) entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM " + table + " WHERE id = :id")
            .setParameter("id", id).getSingleResult();
        return n.longValue() > 0;
    }

    private boolean rowExistsDeleted(String table, Long id) {
        Number n = (Number) entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM " + table + " WHERE id = :id AND deleted = true")
            .setParameter("id", id).getSingleResult();
        return n.longValue() > 0;
    }

    /**
     * Copy scalar + single @ManyToOne data fields from {@code src} to {@code dst}, walking the class
     * hierarchy. Skips identity/audit/discriminator fields ({@link #SKIP_FIELDS}) and all collection/map
     * relationships — the merge repoints references pointing AT the survivor; the survivor's own outgoing
     * collections aren't needed for it to be the canonical, and copying shared collection instances would
     * alias mutable state across two managed entities.
     */
    private void copyDataFields(BaseIdEntity src, BaseIdEntity dst) throws IllegalAccessException {
        for (Class<?> c = src.getClass(); c != null && c != Object.class; c = c.getSuperclass()) {
            for (Field f : c.getDeclaredFields()) {
                int mod = f.getModifiers();
                if (Modifier.isStatic(mod) || Modifier.isFinal(mod)) continue;
                if (SKIP_FIELDS.contains(f.getName())) continue;
                Class<?> ft = f.getType();
                if (Collection.class.isAssignableFrom(ft) || Map.class.isAssignableFrom(ft)) continue;
                f.setAccessible(true);
                f.set(dst, f.get(src));
            }
        }
    }
}
