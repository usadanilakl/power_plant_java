package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.MembershipEvent;
import com.dk_power.power_plant_java.entities.sync.MembershipEvent.Op;
import com.dk_power.power_plant_java.repository.sync.MembershipEventRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.JoinTable;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * LWW-Element-Set (OR-Set) apply for aggregate-membership relationships.
 * See {@code project/features/sync-and-backup/m2m-membership-convergence.md}.
 *
 * <p>Records per-element ADD/REMOVE events keyed by the originating change's sync total-order key,
 * then projects membership: an element is PRESENT iff its latest ADD strictly outranks its latest
 * REMOVE. Because that projection is a per-element {@code max}, the result is a pure function of the
 * event set — it converges regardless of the order in which changes arrive, and re-applying a change
 * is a no-op. This is what the whole-set {@code DELETE-all-then-INSERT} + single last-writer-wins
 * apply could NOT do: it dropped a concurrent peer's addition and could not converge a deferred-then-
 * re-delivered add against a newer remove.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MembershipCrdtService {

    private final MembershipEventRepository eventRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /** Sentinel element id for the per-(owner,field) RESET barrier row. Negative — no real entity id is
     *  ever &le; 0 (DevicePrefixedIdGenerator mints device*1e9 + seq, seq &ge; 1), so it can never collide
     *  with an element id even when ids arrive pre-assigned from another node. */
    private static final Long RESET_SENTINEL = -1L;

    /** (owner_type#field) → join-table coordinates, resolved once from the owning @ManyToMany's @JoinTable. */
    private final Map<String, JoinMeta> joinMetaCache = new ConcurrentHashMap<>();
    private static final JoinMeta NO_JOIN = new JoinMeta(null, null, null);
    private record JoinMeta(String table, String ownerColumn, String inverseColumn) {}

    /**
     * Apply one change's membership delta against the OR-Set, then reconcile the join table for every
     * touched element. Runs in the caller's transaction. Idempotent and order-independent.
     *
     * @param key the change's total-order key (timestamp, origin, changeId) — the SAME for every element
     */
    public void applyDelta(String ownerType, Long ownerId, String fieldName,
                           String joinTable, String ownerColumn, String inverseColumn,
                           Collection<Long> added, Collection<Long> removed, OrderKey key) {
        Set<Long> touched = new LinkedHashSet<>();
        for (Long e : added)   { recordEvent(ownerType, ownerId, fieldName, e, Op.ADD, key);    touched.add(e); }
        for (Long e : removed) { recordEvent(ownerType, ownerId, fieldName, e, Op.REMOVE, key); touched.add(e); }
        for (Long e : touched) {
            reconcileJoinRow(ownerId, e, joinTable, ownerColumn, inverseColumn,
                    isPresent(ownerType, ownerId, fieldName, e));
        }
    }

    /**
     * Apply a whole-set reconcile directive ("make the set exactly {@code target} as of key K", from
     * drift "Use Hub" / accept-remote). Records a RESET barrier at K plus ADD(K) for each target
     * element, so every element whose latest ADD is older than K is suppressed — a delivery-INDEPENDENT
     * clear that converges even against a concurrent OLDER delta (inspecting a receiver-local present-set
     * did not: whether it removed a not-yet-arrived element depended on arrival order).
     */
    public void applyReconcile(String ownerType, Long ownerId, String fieldName,
                               String joinTable, String ownerColumn, String inverseColumn,
                               Collection<Long> targetIds, OrderKey key) {
        recordEvent(ownerType, ownerId, fieldName, RESET_SENTINEL, Op.RESET, key);
        for (Long e : targetIds) recordEvent(ownerType, ownerId, fieldName, e, Op.ADD, key);
        // Reconcile the join for the target set AND every element we have any event for — the RESET can
        // flip a previously-present element to absent.
        Set<Long> touched = new LinkedHashSet<>(targetIds);
        touched.addAll(allElementIds(ownerType, ownerId, fieldName));
        for (Long e : touched) {
            reconcileJoinRow(ownerId, e, joinTable, ownerColumn, inverseColumn,
                    isPresent(ownerType, ownerId, fieldName, e));
        }
    }

    /** The element ids currently PRESENT: latest ADD ≻ latest REMOVE AND latest ADD ⪰ latest RESET. */
    public Set<Long> presentSet(String ownerType, Long ownerId, String fieldName) {
        Map<Long, OrderKey> adds = new HashMap<>();
        Map<Long, OrderKey> removes = new HashMap<>();
        OrderKey reset = null;
        for (MembershipEvent e : eventRepository.findByOwnerTypeAndOwnerIdAndFieldName(ownerType, ownerId, fieldName)) {
            switch (e.getOp()) {
                case ADD    -> adds.put(e.getElementId(), OrderKey.of(e));
                case REMOVE -> removes.put(e.getElementId(), OrderKey.of(e));
                case RESET  -> reset = OrderKey.of(e);
            }
        }
        Set<Long> present = new LinkedHashSet<>();
        for (Map.Entry<Long, OrderKey> a : adds.entrySet()) {
            OrderKey addK = a.getValue();
            OrderKey rem = removes.get(a.getKey());
            if (rem != null && addK.compareTo(rem) <= 0) continue;
            if (reset != null && addK.compareTo(reset) < 0) continue;
            present.add(a.getKey());
        }
        return present;
    }

    private Set<Long> allElementIds(String ownerType, Long ownerId, String fieldName) {
        Set<Long> ids = new LinkedHashSet<>();
        for (MembershipEvent e : eventRepository.findByOwnerTypeAndOwnerIdAndFieldName(ownerType, ownerId, fieldName)) {
            if (!RESET_SENTINEL.equals(e.getElementId())) ids.add(e.getElementId());
        }
        return ids;
    }

    /**
     * Record this node's OWN membership edit into the OR-Set, keyed by the change's GLOBAL id, so the
     * editing node records the IDENTICAL event a receiver records from the synced change — without this,
     * the editor's OR-Set lacks its own additions and later diverges from peers.
     *
     * <p>Crucially this ALSO reconciles the join table (it delegates to the same {@link #applyDelta} /
     * {@link #applyReconcile} the receive path uses). Hibernate has already written the join row for a
     * local edit, but that write is unconditional — a local edit can LOSE under {@link SyncOrder} (a
     * local add of X whose key is older than an already-recorded REMOVE(X), e.g. under clock skew, or an
     * add older than a newer RESET). The OR-Set then says X is absent while Hibernate left X's join row
     * in place → the local join permanently disagrees with the converged set. Reconciling here removes
     * that stray row; for the common winning edit the reconcile is a no-op (the row already matches).
     */
    public void recordLocalMembership(String ownerType, Long ownerId, String fieldName,
                                      String oldValue, String newValue, OrderKey key) {
        JoinMeta jm = resolveJoinMeta(ownerType, fieldName);
        if (jm == null) return; // not an owning @ManyToMany with a @JoinTable (mappedBy / non-join) — nothing to reconcile
        List<Long> newIds = parseIds(newValue);
        if (oldValue != null) {
            Set<Long> oldSet = new LinkedHashSet<>(parseIds(oldValue));
            Set<Long> newSet = new LinkedHashSet<>(newIds);
            Set<Long> added = new LinkedHashSet<>(newSet); added.removeAll(oldSet);
            Set<Long> removed = new LinkedHashSet<>(oldSet); removed.removeAll(newSet);
            applyDelta(ownerType, ownerId, fieldName, jm.table(), jm.ownerColumn(), jm.inverseColumn(),
                    added, removed, key);
        } else {
            applyReconcile(ownerType, ownerId, fieldName, jm.table(), jm.ownerColumn(), jm.inverseColumn(),
                    newIds, key);
        }
    }

    /** Resolve (and cache) the join-table coordinates for an owning @ManyToMany field. null = no owning join. */
    private JoinMeta resolveJoinMeta(String ownerType, String fieldName) {
        JoinMeta jm = joinMetaCache.computeIfAbsent(ownerType + "#" + fieldName, k -> {
            Class<?> cls = entityClassFor(ownerType);
            if (cls == null) return NO_JOIN;
            Field f = findField(cls, fieldName);
            if (f == null) return NO_JOIN;
            JoinTable jt = f.getAnnotation(JoinTable.class);
            if (jt == null || jt.joinColumns().length == 0 || jt.inverseJoinColumns().length == 0) return NO_JOIN;
            return new JoinMeta(jt.name(), jt.joinColumns()[0].name(), jt.inverseJoinColumns()[0].name());
        });
        return jm == NO_JOIN ? null : jm;
    }

    private Class<?> entityClassFor(String ownerType) {
        for (jakarta.persistence.metamodel.EntityType<?> et : entityManager.getMetamodel().getEntities()) {
            if (et.getName().equals(ownerType) || et.getJavaType().getSimpleName().equals(ownerType)) {
                return et.getJavaType();
            }
        }
        return null;
    }

    private static Field findField(Class<?> cls, String name) {
        for (Class<?> c = cls; c != null && c != Object.class; c = c.getSuperclass()) {
            try { return c.getDeclaredField(name); } catch (NoSuchFieldException ignored) { }
        }
        return null;
    }

    /** Fixed origin for the Phase 1b baseline seed — constant across nodes so the key is deterministic. */
    public static final String SEED_ORIGIN = "__seed__";

    /**
     * Seed one baseline ADD for a pre-existing join row (Phase 1b enablement migration). The key is
     * DETERMINISTIC — {@code (baseline ts, SEED_ORIGIN, UUID.nameUUIDFromBytes(owner|field|owner|element))}
     * — so every node seeds the byte-identical event for the same join row and they converge. Because it
     * upserts only-if-newer and {@code baseline} predates every real edit, a seed can never clobber an
     * actual ADD/REMOVE already recorded, and re-running is a no-op. Call once per existing join row.
     */
    public void seedBaselineAdd(String ownerType, Long ownerId, String fieldName, Long elementId, Instant baseline) {
        UUID det = UUID.nameUUIDFromBytes(
                (ownerType + "|" + fieldName + "|" + ownerId + "|" + elementId).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        recordEvent(ownerType, ownerId, fieldName, elementId, Op.ADD, new OrderKey(baseline, SEED_ORIGIN, det));
    }

    private static List<Long> parseIds(String json) {
        List<Long> ids = new ArrayList<>();
        if (json == null || json.isEmpty() || "null".equals(json) || "[]".equals(json)) return ids;
        json = json.trim();
        if (json.startsWith("[") && json.endsWith("]")) {
            for (String s : json.substring(1, json.length() - 1).split(",")) {
                s = s.trim().replace("\"", "");
                if (!s.isEmpty()) ids.add(Long.parseLong(s));
            }
        }
        return ids;
    }

    /** Keep only the latest ADD / latest REMOVE per element: upsert iff the new key strictly outranks. */
    private void recordEvent(String ownerType, Long ownerId, String fieldName, Long elementId,
                             Op op, OrderKey key) {
        MembershipEvent existing = eventRepository
                .findByOwnerTypeAndOwnerIdAndFieldNameAndElementIdAndOp(ownerType, ownerId, fieldName, elementId, op)
                .orElse(null);
        if (existing == null) {
            eventRepository.save(new MembershipEvent(ownerType, ownerId, fieldName, elementId, op,
                    key.ts(), key.origin(), key.changeId()));
        } else if (key.compareTo(OrderKey.of(existing)) > 0) {
            existing.setTs(key.ts());
            existing.setOrigin(key.origin());
            existing.setChangeId(key.changeId());
            eventRepository.save(existing);
        }
        // else: an equal or older op for this element — ignore (idempotent, order-independent).
    }

    private boolean isPresent(String ownerType, Long ownerId, String fieldName, Long elementId) {
        OrderKey add = keyFor(ownerType, ownerId, fieldName, elementId, Op.ADD);
        if (add == null) return false;
        OrderKey rem = keyFor(ownerType, ownerId, fieldName, elementId, Op.REMOVE);
        if (rem != null && add.compareTo(rem) <= 0) return false;
        OrderKey reset = keyFor(ownerType, ownerId, fieldName, RESET_SENTINEL, Op.RESET);
        return reset == null || add.compareTo(reset) >= 0;
    }

    private OrderKey keyFor(String ownerType, Long ownerId, String fieldName, Long elementId, Op op) {
        return eventRepository
                .findByOwnerTypeAndOwnerIdAndFieldNameAndElementIdAndOp(ownerType, ownerId, fieldName, elementId, op)
                .map(OrderKey::of).orElse(null);
    }

    /** INSERT/DELETE exactly one join row to match computed presence (idempotent). */
    private void reconcileJoinRow(Long ownerId, Long elementId, String joinTable,
                                  String ownerColumn, String inverseColumn, boolean present) {
        long rows = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM " + joinTable + " WHERE " + ownerColumn + " = :o AND " + inverseColumn + " = :e")
                .setParameter("o", ownerId).setParameter("e", elementId).getSingleResult()).longValue();
        if (present && rows == 0) {
            entityManager.createNativeQuery(
                    "INSERT INTO " + joinTable + " (" + ownerColumn + ", " + inverseColumn + ") VALUES (:o, :e)")
                    .setParameter("o", ownerId).setParameter("e", elementId).executeUpdate();
        } else if (!present && rows > 0) {
            entityManager.createNativeQuery(
                    "DELETE FROM " + joinTable + " WHERE " + ownerColumn + " = :o AND " + inverseColumn + " = :e")
                    .setParameter("o", ownerId).setParameter("e", elementId).executeUpdate();
        }
    }

    /**
     * The sync total order over a change key — MUST mirror {@link SyncOrder#TOTAL} exactly (convergence
     * depends on every node ordering identically): timestamp, then origin (nulls first), then changeId
     * (nulls first).
     */
    public record OrderKey(Instant ts, String origin, UUID changeId) implements Comparable<OrderKey> {
        static OrderKey of(MembershipEvent e) { return new OrderKey(e.getTs(), e.getOrigin(), e.getChangeId()); }

        @Override
        public int compareTo(OrderKey o) {
            int c = ts.compareTo(o.ts);
            if (c != 0) return c;
            c = nullsFirst(origin, o.origin);
            if (c != 0) return c;
            return nullsFirst(changeId, o.changeId);
        }

        private static <T extends Comparable<T>> int nullsFirst(T a, T b) {
            if (Objects.equals(a, b)) return 0;
            if (a == null) return -1;
            if (b == null) return 1;
            return a.compareTo(b);
        }
    }
}
