package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.MembershipEvent;
import com.dk_power.power_plant_java.entities.sync.MembershipEvent.Op;
import com.dk_power.power_plant_java.repository.sync.MembershipEventRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

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

    /** The element ids currently PRESENT for this membership (latest ADD ≻ latest REMOVE). */
    public Set<Long> presentSet(String ownerType, Long ownerId, String fieldName) {
        Map<Long, OrderKey> adds = new HashMap<>();
        Map<Long, OrderKey> removes = new HashMap<>();
        for (MembershipEvent e : eventRepository.findByOwnerTypeAndOwnerIdAndFieldName(ownerType, ownerId, fieldName)) {
            (e.getOp() == Op.ADD ? adds : removes).put(e.getElementId(), OrderKey.of(e));
        }
        Set<Long> present = new LinkedHashSet<>();
        for (Map.Entry<Long, OrderKey> a : adds.entrySet()) {
            OrderKey rem = removes.get(a.getKey());
            if (rem == null || a.getValue().compareTo(rem) > 0) present.add(a.getKey());
        }
        return present;
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
        OrderKey rem = keyFor(ownerType, ownerId, fieldName, elementId, Op.REMOVE);
        return add != null && (rem == null || add.compareTo(rem) > 0);
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
