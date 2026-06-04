package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import jakarta.persistence.EntityManager;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.metamodel.EntityType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;

/**
 * Shared helper that repoints entity references from a duplicate {@link Value} to a
 * canonical {@link Value} via JPA, so that {@link FieldChangeEntityListener} emits
 * {@code FieldChange} rows and the change propagates to other machines.
 *
 * <p>Two surface areas:
 * <ul>
 *   <li><b>Native-SQL safety map</b> — {@code (table, column)} pairs filtered by
 *       {@code INFORMATION_SCHEMA}. Used for read-only COUNTs that bypass
 *       {@code @Where(deleted IS NOT TRUE)} and tell the truth about FK state.
 *       The map is built once per call so a single discovery query covers every
 *       scalar FK column and every ManyToMany join-table inverse column.</li>
 *   <li><b>JPA mutation descriptor</b> — per-entity-type lists of scalar Value
 *       fields and Collection&lt;Value&gt; fields. The repoint loads each owner
 *       via JPQL, mutates via reflection-on-managed-entity, and {@code em.merge}s.
 *       Scalar mutations fire {@code @PostUpdate} on flush; collection mutations
 *       do NOT (Hibernate touches only the join table), so this class also emits
 *       a synthetic {@code FieldChange} via {@link FieldChangeTracker} for every
 *       owner whose collection was mutated. Verified by {@code DedupFieldChangeEmissionIT}.</li>
 * </ul>
 *
 * <p>Callers (admin dedup tool, sync-time dedup) should:
 * <ol>
 *   <li>Build the {@link Metadata} once via {@link #discover()}.</li>
 *   <li>Pre-count refs to the orphan via {@link #countReferencesSql(Long, Metadata)}.</li>
 *   <li>Repoint via {@link #repointAllReferences(Long, Value, Metadata)} — this
 *       handles both scalar and collection cases.</li>
 *   <li>{@link EntityManager#flush() flush()} before re-counting.</li>
 *   <li>Re-count, only soft-delete the orphan if {@code postCount == 0}.</li>
 * </ol>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ValueReferenceRepointService {

    private final FieldChangeTracker fieldChangeTracker;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Captures everything one dedup pass needs: which (table, column) pairs to
     * COUNT/probe via native SQL, and which JPA fields to mutate per entity type.
     */
    public static final class Metadata {
        /** Native-SQL safety map: {@code tableName -> [columns]}, filtered by INFORMATION_SCHEMA. */
        public final Map<String, List<String>> fkColumns;
        /** Per-entity-type JPA descriptors. */
        public final Map<String, EntityDescriptor> entityDescriptors;

        Metadata(Map<String, List<String>> fkColumns, Map<String, EntityDescriptor> entityDescriptors) {
            this.fkColumns = fkColumns;
            this.entityDescriptors = entityDescriptors;
        }
    }

    /** JPA-level description of how a single entity type holds Value references. */
    public static final class EntityDescriptor {
        public final String entityName;
        public final Class<?> entityClass;
        /** Scalar {@code @ManyToOne Value} fields. */
        public final List<Field> scalarFields;
        /** {@code Collection<Value>} fields (typically {@code @ManyToMany Set<Value>}). */
        public final List<Field> collectionFields;

        EntityDescriptor(String entityName, Class<?> entityClass,
                         List<Field> scalarFields, List<Field> collectionFields) {
            this.entityName = entityName;
            this.entityClass = entityClass;
            this.scalarFields = scalarFields;
            this.collectionFields = collectionFields;
        }

        public boolean isEmpty() {
            return scalarFields.isEmpty() && collectionFields.isEmpty();
        }
    }

    /**
     * Walk the JPA metamodel once and build both the native-SQL safety map and
     * the JPA mutation descriptors. Native-SQL pairs are filtered against
     * {@code INFORMATION_SCHEMA.COLUMNS} so a wrongly-derived column name doesn't
     * later throw and mark the transaction rollback-only.
     */
    public Metadata discover() {
        Map<String, List<String>> rawFkColumns = new TreeMap<>();
        Map<String, EntityDescriptor> descriptors = new LinkedHashMap<>();

        for (EntityType<?> entity : entityManager.getMetamodel().getEntities()) {
            Class<?> entityClass = entity.getJavaType();
            if (entityClass == null || entityClass.equals(Value.class)) continue;

            String tableName = resolveTableName(entityClass);
            if (tableName == null || tableName.isBlank()) continue;

            List<Field> scalarFields = new ArrayList<>();
            List<Field> collectionFields = new ArrayList<>();
            List<String> ownerFkColumns = new ArrayList<>();

            for (Class<?> clazz = entityClass; clazz != null && !clazz.equals(Object.class); clazz = clazz.getSuperclass()) {
                for (Field field : clazz.getDeclaredFields()) {
                    if (field.isAnnotationPresent(Transient.class)) continue;
                    if (Value.class.equals(field.getType())) {
                        // Require @ManyToOne so we skip transient / non-persistent
                        // Value fields that would build invalid JPQL ("e.field.id")
                        // and poison the dedup transaction.
                        if (!field.isAnnotationPresent(ManyToOne.class)) continue;
                        field.setAccessible(true);
                        scalarFields.add(field);
                        JoinColumn jc = field.getAnnotation(JoinColumn.class);
                        String columnName = (jc != null && !jc.name().isEmpty())
                                ? jc.name()
                                : camelToSnake(field.getName()) + "_id";
                        if (!ownerFkColumns.contains(columnName)) ownerFkColumns.add(columnName);
                    } else if (Collection.class.isAssignableFrom(field.getType())
                            && isCollectionOfValue(field)) {
                        // ONLY the owning side of @ManyToMany with @JoinTable is a
                        // repointable collection. @OneToMany(mappedBy=...) is the
                        // inverse of a scalar @ManyToOne — mutating it doesn't
                        // re-point anything (the scalar side is the source of truth)
                        // and would emit a misleading synthetic FieldChange for the
                        // inverse field. Example we must NOT match: Category.values
                        // is @OneToMany(mappedBy="category"). Repointing Value.category
                        // is the right operation, not Category.values.removeIf(...).
                        if (!field.isAnnotationPresent(ManyToMany.class)) continue;
                        if (!field.isAnnotationPresent(JoinTable.class)) continue;
                        field.setAccessible(true);
                        collectionFields.add(field);
                        recordJoinTableFk(field, rawFkColumns);
                    }
                }
            }

            if (!ownerFkColumns.isEmpty()) {
                rawFkColumns.merge(tableName, ownerFkColumns, (existing, additions) -> {
                    for (String c : additions) {
                        if (!existing.contains(c)) existing.add(c);
                    }
                    return existing;
                });
            }

            if (!scalarFields.isEmpty() || !collectionFields.isEmpty()) {
                descriptors.put(entity.getName(),
                        new EntityDescriptor(entity.getName(), entityClass, scalarFields, collectionFields));
            }
        }

        Map<String, List<String>> filtered = filterToExistingColumns(rawFkColumns);
        return new Metadata(filtered, descriptors);
    }

    /**
     * Result of a repoint pass. Holds the row count and any deferred synthetic
     * FieldChange descriptors that the caller must emit only AFTER
     * verify-before-delete has passed and the orphan has been soft-deleted.
     * <p>
     * <b>Why deferred:</b> {@link FieldChangeTracker#trackEntityUpdate} runs in
     * {@code REQUIRES_NEW}, so calling it inline during the repoint would commit
     * a synthetic FieldChange BEFORE the outer dedup transaction has proven
     * itself safe. If the post-count or soft-delete then fails and rolls the
     * outer transaction back, clients would receive a collection repoint that
     * never actually committed on the hub.
     */
    public static final class RepointOutcome {
        public final long ownerRowsTouched;
        public final List<PendingSyntheticFieldChange> pendingCollectionFieldChanges;

        RepointOutcome(long ownerRowsTouched, List<PendingSyntheticFieldChange> pending) {
            this.ownerRowsTouched = ownerRowsTouched;
            this.pendingCollectionFieldChanges = pending;
        }
    }

    /** A synthetic FieldChange descriptor captured during collection repoint. */
    public static final class PendingSyntheticFieldChange {
        final BaseIdEntity owner;
        final String fieldName;
        final Object originalCollectionSnapshot;

        PendingSyntheticFieldChange(BaseIdEntity owner, String fieldName, Object originalCollectionSnapshot) {
            this.owner = owner;
            this.fieldName = fieldName;
            this.originalCollectionSnapshot = originalCollectionSnapshot;
        }
    }

    /**
     * Repoint every entity reference from {@code orphanId} to {@code canonical}
     * via JPA. Scalar mutations fire {@code @PostUpdate} automatically (their
     * FieldChange rows are committed by {@link FieldChangeEntityListener} in its
     * own {@code REQUIRES_NEW} transaction — a pre-existing architectural
     * window we don't tackle here). Collection mutations do NOT fire
     * {@code @PostUpdate}; this method captures pending synthetic FieldChange
     * descriptors and returns them so the caller can defer emission until after
     * all verify-before-delete steps that can abort the transaction.
     *
     * <p>Caller must invoke {@link #emitPendingFieldChanges(List)} after the
     * verify pass succeeds (and ideally after soft-delete) so a later abort
     * doesn't leave a committed synthetic FieldChange that never happened.
     */
    public RepointOutcome repointAllReferences(Long orphanId, Value canonical, Metadata meta) {
        if (orphanId == null || canonical == null) {
            return new RepointOutcome(0, Collections.emptyList());
        }
        long touched = 0;
        List<PendingSyntheticFieldChange> pending = new ArrayList<>();
        for (EntityDescriptor desc : meta.entityDescriptors.values()) {
            try {
                touched += repointScalarFields(orphanId, canonical, desc);
                touched += repointCollectionFields(orphanId, canonical, desc, pending);
            } catch (Exception e) {
                log.error("repointAllReferences: failed for entity type {} (orphan #{} → canonical #{})",
                        desc.entityName, orphanId, canonical.getId(), e);
                throw e;
            }
        }
        return new RepointOutcome(touched, pending);
    }

    /**
     * Emit the synthetic FieldChange rows captured during a prior
     * {@link #repointAllReferences} pass. Each entry represents a real collection
     * mutation that has been applied via JPA but won't be auto-tracked by
     * {@link FieldChangeEntityListener} (Hibernate doesn't update the owner row
     * for ManyToMany changes). The caller must invoke this before / alongside
     * any verify-before-delete so clients learn about the committed mutations
     * even when the dedup-pair otherwise aborts.
     * <p>
     * <b>Fail-loud:</b>
     * <ul>
     *   <li>{@link FieldChangeTracker#trackEntityUpdate} catches and logs many
     *       internal failures, returning a (possibly empty) list. An empty list
     *       for a pending entry means no FieldChange row was actually written —
     *       silently treating that as success would leave the hub with a
     *       repointed collection while clients still hold the old state.
     *       Throwing here gives the dedup driver a chance to mark its tx
     *       rollback-only.</li>
     *   <li>If the tracker itself throws, we log and rethrow.</li>
     * </ul>
     */
    public void emitPendingFieldChanges(List<PendingSyntheticFieldChange> pending) {
        if (pending == null || pending.isEmpty()) return;
        for (PendingSyntheticFieldChange p : pending) {
            List<?> tracked;
            try {
                Map<String, Object> originalValues = new HashMap<>();
                originalValues.put(p.fieldName, p.originalCollectionSnapshot);
                // Use the MANDATORY-propagation variant so the FieldChange row(s)
                // commit/roll-back atomically with the caller's tx. The
                // REQUIRES_NEW variant (trackEntityUpdate) would commit
                // independently and could survive an outer rollback, leaving
                // hub and clients diverged.
                tracked = fieldChangeTracker.trackEntityUpdateInCurrentTx(originalValues, p.owner);
            } catch (Exception e) {
                log.error("emitPendingFieldChanges: tracker threw for {} #{} field {} — clients may not see this collection repoint",
                        p.owner.getClass().getSimpleName(), p.owner.getId(), p.fieldName, e);
                throw new SyntheticFieldChangeEmissionException(p, e);
            }
            // Tracker returned, but did it actually write a row? It returns an
            // empty list when sync context is active, original values were
            // empty/unequal at the comparator level, or an internal exception
            // was caught. None of these are acceptable for a known mutation.
            if (tracked == null || tracked.isEmpty()) {
                log.error("emitPendingFieldChanges: tracker returned empty result for {} #{} field {} — "
                                + "FieldChange row was NOT written despite a real collection mutation. "
                                + "Hub will commit the join-table repoint while clients miss it.",
                        p.owner.getClass().getSimpleName(), p.owner.getId(), p.fieldName);
                throw new SyntheticFieldChangeEmissionException(p, null);
            }
        }
    }

    /**
     * Thrown by {@link #emitPendingFieldChanges} when a synthetic FieldChange
     * row was expected but not written. Callers should mark their transaction
     * rollback-only so the matching JPA collection mutation also rolls back,
     * keeping hub and clients in sync.
     */
    public static final class SyntheticFieldChangeEmissionException extends RuntimeException {
        public SyntheticFieldChangeEmissionException(PendingSyntheticFieldChange pending, Throwable cause) {
            super("synthetic FieldChange emission failed for "
                    + pending.owner.getClass().getSimpleName() + " #" + pending.owner.getId()
                    + " field " + pending.fieldName, cause);
        }
    }

    private long repointScalarFields(Long orphanId, Value canonical, EntityDescriptor desc) {
        if (desc.scalarFields.isEmpty()) return 0;
        long touched = 0;
        for (Field field : desc.scalarFields) {
            // JPQL: SELECT DISTINCT e FROM <EntityName> e WHERE e.<field>.id = :dupId
            String jpql = "SELECT DISTINCT e FROM " + desc.entityName
                    + " e WHERE e." + field.getName() + ".id = :dupId";
            List<?> owners;
            try {
                owners = entityManager.createQuery(jpql).setParameter("dupId", orphanId).getResultList();
            } catch (Exception e) {
                log.error("repointScalarFields: JPQL failed: {}", jpql, e);
                throw e;
            }
            for (Object owner : owners) {
                try {
                    field.set(owner, canonical);
                    entityManager.merge(owner);
                    touched++;
                } catch (IllegalAccessException iae) {
                    throw new IllegalStateException(
                            "Failed to set field " + desc.entityName + "." + field.getName(), iae);
                }
            }
            if (!owners.isEmpty()) {
                log.info("repointScalarFields: {} {}.{} owner row(s) repointed #{} → #{}",
                        owners.size(), desc.entityName, field.getName(), orphanId, canonical.getId());
            }
        }
        return touched;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private long repointCollectionFields(Long orphanId, Value canonical, EntityDescriptor desc,
                                         List<PendingSyntheticFieldChange> pending) {
        if (desc.collectionFields.isEmpty()) return 0;
        long touched = 0;
        for (Field field : desc.collectionFields) {
            // JPQL JOIN form is portable for collection lookup. EXISTS (SELECT 1 FROM e.field v ...)
            // is Hibernate-flavored and not guaranteed across JPA providers.
            String jpql = "SELECT DISTINCT e FROM " + desc.entityName
                    + " e JOIN e." + field.getName() + " v WHERE v.id = :dupId";
            List<?> owners;
            try {
                owners = entityManager.createQuery(jpql).setParameter("dupId", orphanId).getResultList();
            } catch (Exception e) {
                log.error("repointCollectionFields: JPQL failed: {}", jpql, e);
                throw e;
            }
            for (Object owner : owners) {
                try {
                    Collection<Object> collection = (Collection<Object>) field.get(owner);
                    if (collection == null) continue;

                    // Snapshot the ORIGINAL collection (pre-mutation) for the synthetic
                    // FieldChange. trackEntityUpdate diffs originalValues against the
                    // entity's current state — if we snapshot after mutation, the diff
                    // is empty and no FieldChange row is written.
                    Set<Object> originalSnapshot = new HashSet<>(collection);

                    // ID-based removal: Value has no equals/hashCode override, so
                    // collection.remove(dup) by reference can silently miss when the
                    // collection holds a different managed instance for the same row.
                    boolean removed = collection.removeIf(item ->
                            item instanceof Value && Objects.equals(((Value) item).getId(), orphanId));
                    if (!removed) continue;

                    // Avoid duplicate add if canonical is already in the collection.
                    boolean canonicalAlreadyPresent = collection.stream()
                            .anyMatch(item -> item instanceof Value
                                    && Objects.equals(((Value) item).getId(), canonical.getId()));
                    if (!canonicalAlreadyPresent) {
                        collection.add(canonical);
                    }

                    entityManager.merge(owner);

                    // Defer synthetic FieldChange emission. Hibernate doesn't update
                    // the owner row for a ManyToMany change, so @PostUpdate won't fire
                    // and FieldChangeEntityListener stays silent — we have to emit
                    // explicitly. But emitting inline would commit (REQUIRES_NEW) before
                    // verify-before-delete runs in the caller. If that verify aborts
                    // and rolls the outer transaction back, the join-table mutation
                    // rolls back too while the synthetic FieldChange row remains
                    // committed — clients then see a repoint that didn't actually
                    // happen on the hub. So we capture the descriptor here and let
                    // the caller emit only after all verify steps pass.
                    if (owner instanceof BaseIdEntity baseOwner) {
                        pending.add(new PendingSyntheticFieldChange(
                                baseOwner, field.getName(), originalSnapshot));
                    } else {
                        log.warn("repointCollectionFields: owner {} is not BaseIdEntity, skipping synthetic FieldChange",
                                desc.entityName);
                    }

                    touched++;
                } catch (IllegalAccessException iae) {
                    throw new IllegalStateException(
                            "Failed to access collection " + desc.entityName + "." + field.getName(), iae);
                }
            }
            if (!owners.isEmpty()) {
                log.info("repointCollectionFields: {} {}.{} owner row(s) repointed #{} → #{}",
                        owners.size(), desc.entityName, field.getName(), orphanId, canonical.getId());
            }
        }
        return touched;
    }

    /**
     * Count entity rows that reference {@code valueId} across all known FK columns,
     * via direct native SQL. Bypasses {@code @Where(deleted IS NOT TRUE)}, so it
     * tells the truth even when an orphan is already soft-deleted. Used as the
     * verify-before-delete gate.
     * <p>
     * <b>Fail-loud:</b> any probe failure is rethrown as
     * {@link CountProbeFailureException}. The {@code INFORMATION_SCHEMA} filter
     * in {@link #filterToExistingColumns} already removed phantom columns, so a
     * runtime failure here means real schema drift or a permission issue. If we
     * swallowed it, the missing count would silently turn into "0 references
     * remain" and the dedup would proceed to soft-delete the orphan — exactly
     * the dangerous direction we are guarding against.
     */
    public long countReferencesSql(Long valueId, Metadata meta) {
        if (valueId == null || meta == null) return 0;
        return countReferencesByFkMap(valueId, meta.fkColumns);
    }

    /**
     * Same fail-loud semantics as {@link #countReferencesSql(Long, Metadata)} but
     * accepts a raw {@code (table, column)} FK map. Use this for any entity type
     * (e.g. {@link com.dk_power.power_plant_java.entities.categories.Category})
     * whose FK columns were discovered separately. The caller is responsible
     * for INFORMATION_SCHEMA filtering — {@link #discoverCategoryFkColumns()}
     * already does it; pass the result directly.
     */
    public long countReferencesByFkMap(Long entityId, Map<String, List<String>> fkColumns) {
        if (entityId == null || fkColumns == null || fkColumns.isEmpty()) return 0;
        long total = 0;
        for (Map.Entry<String, List<String>> entry : fkColumns.entrySet()) {
            String table = entry.getKey();
            for (String column : entry.getValue()) {
                try {
                    Number count = (Number) entityManager.createNativeQuery(
                                    "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = :id")
                            .setParameter("id", entityId)
                            .getSingleResult();
                    if (count != null) total += count.longValue();
                } catch (Exception e) {
                    log.error("countReferencesByFkMap: probe failed for {}.{} (id={}) — failing loud to keep verify-before-delete safe",
                            table, column, entityId, e);
                    throw new CountProbeFailureException(table, column, entityId, e);
                }
            }
        }
        return total;
    }

    /**
     * Per-(table, column) breakdown for use in error reports when verify-before-delete fails.
     * Same fail-loud policy as {@link #countReferencesSql} — silently dropping a
     * probe would understate the breakdown shown to the operator.
     */
    public Map<String, Long> countReferencesByLocationSql(Long valueId, Metadata meta) {
        if (valueId == null || meta == null) return Collections.emptyMap();
        return countReferencesByLocationByFkMap(valueId, meta.fkColumns);
    }

    /**
     * Same shape as {@link #countReferencesByLocationSql(Long, Metadata)} but
     * takes a raw {@code (table, column)} map. Use this for any entity type
     * (e.g. {@link com.dk_power.power_plant_java.entities.categories.Category})
     * whose FK columns were discovered separately.
     */
    public Map<String, Long> countReferencesByLocationByFkMap(Long entityId, Map<String, List<String>> fkColumns) {
        if (entityId == null || fkColumns == null || fkColumns.isEmpty()) return Collections.emptyMap();
        Map<String, Long> breakdown = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> entry : fkColumns.entrySet()) {
            String table = entry.getKey();
            for (String column : entry.getValue()) {
                try {
                    Number count = (Number) entityManager.createNativeQuery(
                                    "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = :id")
                            .setParameter("id", entityId)
                            .getSingleResult();
                    if (count != null && count.longValue() > 0) {
                        breakdown.put(table + "." + column, count.longValue());
                    }
                } catch (Exception e) {
                    log.error("countReferencesByLocationByFkMap: probe failed for {}.{} (id={})",
                            table, column, entityId, e);
                    throw new CountProbeFailureException(table, column, entityId, e);
                }
            }
        }
        return breakdown;
    }

    /**
     * Thrown when a verify-before-delete COUNT probe fails on a (table, column)
     * pair that {@link #filterToExistingColumns} confirmed exists in the schema.
     * Always indicates real trouble — never swallow.
     */
    public static final class CountProbeFailureException extends RuntimeException {
        public CountProbeFailureException(String table, String column, Long valueId, Throwable cause) {
            super("count probe failed for " + table + "." + column + " (valueId=" + valueId + ")", cause);
        }
    }

    /**
     * Find every persistent {@code @ManyToOne Category} FK column in the DB
     * (today only {@code val_table.category_id}).
     * <p>
     * Mirrors the scalar discovery for {@link Value}: requires {@code @ManyToOne}
     * (so we don't try to repoint via transient/computed fields whose Java type
     * happens to be {@code Category}) and skips {@code @Transient} fields. Without
     * this, a non-persistent field with a coincidentally-existing derived column
     * name would pass the {@link #filterToExistingColumns} cross-check and feed
     * the count probe map.
     */
    public Map<String, List<String>> discoverCategoryFkColumns() {
        Map<String, List<String>> raw = new TreeMap<>();
        for (EntityType<?> entity : entityManager.getMetamodel().getEntities()) {
            Class<?> entityClass = entity.getJavaType();
            if (entityClass == null) continue;
            String tableName = resolveTableName(entityClass);
            if (tableName == null || tableName.isBlank()) continue;
            for (Class<?> clazz = entityClass; clazz != null && !clazz.equals(Object.class); clazz = clazz.getSuperclass()) {
                for (Field field : clazz.getDeclaredFields()) {
                    if (field.isAnnotationPresent(Transient.class)) continue;
                    if (!com.dk_power.power_plant_java.entities.categories.Category.class.equals(field.getType())) continue;
                    if (!field.isAnnotationPresent(ManyToOne.class)) continue;
                    JoinColumn jc = field.getAnnotation(JoinColumn.class);
                    String columnName = (jc != null && !jc.name().isEmpty())
                            ? jc.name()
                            : camelToSnake(field.getName()) + "_id";
                    raw.computeIfAbsent(tableName, k -> new ArrayList<>());
                    if (!raw.get(tableName).contains(columnName)) raw.get(tableName).add(columnName);
                }
            }
        }
        return filterToExistingColumns(raw);
    }

    /**
     * Persist a dedup remap so future incoming sync batches that reference the
     * deleted duplicate ID get redirected to the canonical ID. The remap is
     * REQUIRED — without it, sync changes pointing at the soft-deleted duplicate
     * hit a row that {@code @Where(deleted IS NOT TRUE)} filters out, and the
     * apply fails silently. Both the sync-time merge AND the admin orphan dedup
     * must call this on every successful soft-delete; otherwise the two paths
     * have asymmetric sync semantics.
     * <p>
     * Fail-loud: insert failures throw, callers must run inside a tx and let
     * the throw roll the pair back. Better to leave the merge un-applied than
     * to soft-delete without the redirect record.
     */
    public void persistDedupRemap(String entityType, Long originalId, Long remappedId) {
        try {
            entityManager.createNativeQuery(
                "MERGE INTO dedup_id_remap (entity_type, original_id, remapped_id, created_at) " +
                "KEY (entity_type, original_id) " +
                "VALUES (:entityType, :originalId, :remappedId, :createdAt)")
                .setParameter("entityType", entityType)
                .setParameter("originalId", originalId)
                .setParameter("remappedId", remappedId)
                .setParameter("createdAt", java.time.Instant.now())
                .executeUpdate();
        } catch (Exception e) {
            log.error("persistDedupRemap: failed for {}:{}->{} — rolling pair back so the merge isn't applied without the redirect record",
                    entityType, originalId, remappedId, e);
            throw new IllegalStateException("Failed to persist dedup remap for "
                    + entityType + " " + originalId + " -> " + remappedId, e);
        }
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private boolean isCollectionOfValue(Field field) {
        Type generic = field.getGenericType();
        if (!(generic instanceof ParameterizedType pt)) return false;
        Type[] args = pt.getActualTypeArguments();
        return args.length > 0 && args[0] instanceof Class<?> elemClass
                && Value.class.equals(elemClass);
    }

    /** Record the (joinTable, inverseJoinColumn) so native-SQL counts include
     *  the ManyToMany side of references — vital for verify-before-delete. */
    private void recordJoinTableFk(Field field, Map<String, List<String>> raw) {
        ManyToMany mm = field.getAnnotation(ManyToMany.class);
        JoinTable jt = field.getAnnotation(JoinTable.class);
        if (mm == null || jt == null) return; // only owning side has @JoinTable
        if (jt.name().isEmpty()) return;
        if (jt.inverseJoinColumns().length == 0) return;
        String joinTable = jt.name();
        String inverseCol = jt.inverseJoinColumns()[0].name();
        if (inverseCol == null || inverseCol.isEmpty()) return;
        raw.computeIfAbsent(joinTable, k -> new ArrayList<>());
        if (!raw.get(joinTable).contains(inverseCol)) raw.get(joinTable).add(inverseCol);
    }

    private String resolveTableName(Class<?> entityClass) {
        Table table = entityClass.getAnnotation(Table.class);
        if (table != null && !table.name().isEmpty()) return table.name();
        return camelToSnake(entityClass.getSimpleName());
    }

    private static String camelToSnake(String s) {
        return s == null ? null : s.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    /**
     * Cross-check {@code (table, column)} pairs against {@code INFORMATION_SCHEMA.COLUMNS}.
     * Drops pairs that don't exist in the live DB — without this, a single
     * non-existent column poisons the transaction (rollback-only) even when the
     * resulting exception is caught.
     */
    private Map<String, List<String>> filterToExistingColumns(Map<String, List<String>> raw) {
        if (raw.isEmpty()) return raw;
        Set<String> existing = new HashSet<>();
        try {
            @SuppressWarnings("unchecked")
            List<Object[]> rows = entityManager.createNativeQuery(
                            "SELECT UPPER(TABLE_NAME), UPPER(COLUMN_NAME) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'PUBLIC'")
                    .getResultList();
            for (Object[] row : rows) existing.add(row[0] + "." + row[1]);
        } catch (Exception e) {
            log.warn("filterToExistingColumns: INFORMATION_SCHEMA probe failed, returning unfiltered: {}",
                    e.getMessage());
            return raw;
        }
        Map<String, List<String>> filtered = new TreeMap<>();
        int dropped = 0;
        for (Map.Entry<String, List<String>> entry : raw.entrySet()) {
            String table = entry.getKey();
            List<String> ok = new ArrayList<>();
            for (String column : entry.getValue()) {
                if (existing.contains(table.toUpperCase() + "." + column.toUpperCase())) {
                    ok.add(column);
                } else {
                    dropped++;
                    log.debug("filterToExistingColumns: dropping {}.{} (not in DB schema)", table, column);
                }
            }
            if (!ok.isEmpty()) filtered.put(table, ok);
        }
        if (dropped > 0) {
            log.info("filterToExistingColumns: dropped {} (table, column) pair(s) that don't exist in DB", dropped);
        }
        return filtered;
    }
}
