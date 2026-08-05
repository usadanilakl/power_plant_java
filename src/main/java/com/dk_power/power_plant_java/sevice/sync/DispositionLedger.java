package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;

import java.util.HashMap;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Per-change outcomes for ONE apply run — the missing half of the apply path's return value.
 *
 * <p>{@code FieldSyncService} reports only an {@code int applied} count, which collapses five
 * semantically-different outcomes into "0": no service for the type, a parent that isn't present yet,
 * an unknown field, a transient rollback, and "already converged". The receiver then acks all of them
 * identically, so a change that was never resolved is marked delivered and never re-sent. This ledger
 * records the WHY alongside the count so acknowledgement can become honest (Inc 2) and so the hub can
 * hold a durable disposition per change (Inc 7/8).
 *
 * <p><b>Identity-keyed, deliberately.</b> Keys are {@link FieldChange} instances, not UUIDs, because
 * changes reaching this path may have a null id (see {@code FieldSyncService.markDeferred}, which
 * guards on {@code getId() != null}, and the hub's freshly-built rows). Identity keying records those
 * faithfully; {@link #idsWith} then skips nulls, mirroring the existing hole exactly rather than
 * silently changing behaviour.
 *
 * <p><b>Precedence.</b> One change can legitimately be recorded twice in a single run — the CREATE
 * path counts a change applied while the same change can still be deferred by a later pass. Recording
 * is therefore rank-ordered and monotonic: a lower-rank outcome NEVER overwrites a higher-rank one, so
 * the result does not depend on which pass fired last.
 *
 * <p><b>Not thread-safe.</b> By contract this is a per-apply-run local, held only for the duration of
 * a single {@code applyChangesLock} critical section. Never share it across threads or store it as
 * long-lived state.
 */
public class DispositionLedger {

    /** Higher rank wins. Unresolved outcomes outrank resolved ones so a change is never wrongly acked. */
    private static int rank(ChangeDisposition d) {
        return switch (d) {
            case DEFERRED -> 5;
            case FAILED_RETRYABLE -> 4;
            case DEAD_LETTER -> 3;
            case APPLIED -> 2;
            case NOOP_SUPERSEDED -> 1;
        };
    }

    private final Map<FieldChange, ChangeDisposition> byChange = new IdentityHashMap<>();

    /**
     * Record {@code disposition} for {@code change}, keeping the highest-ranked outcome seen.
     * Null-safe on both arguments (a null change is ignored rather than throwing inside the apply path).
     */
    public void record(FieldChange change, ChangeDisposition disposition) {
        if (change == null || disposition == null) return;
        ChangeDisposition existing = byChange.get(change);
        if (existing == null || rank(disposition) > rank(existing)) {
            byChange.put(change, disposition);
        }
    }

    /** Record the same disposition for every change in {@code changes}. */
    public void recordAll(Iterable<FieldChange> changes, ChangeDisposition disposition) {
        if (changes == null) return;
        for (FieldChange c : changes) record(c, disposition);
    }

    /**
     * Fold another ledger's outcomes into this one, keeping the highest-ranked per change (same
     * precedence as {@link #record}). Used by bisect-on-rollback: each sub-batch is applied with its
     * OWN fresh ledger so a rolled-back attempt's optimistic APPLIED notes never leak here — only a
     * SUCCESSFUL sub-batch is merged in, so a re-applied change's real outcome cannot be masked by a
     * stale FAILED_RETRYABLE from the abandoned whole-batch attempt.
     */
    public void merge(DispositionLedger other) {
        if (other == null) return;
        for (Map.Entry<FieldChange, ChangeDisposition> e : other.byChange.entrySet()) {
            record(e.getKey(), e.getValue());
        }
    }

    /** The recorded outcome for {@code change}, or null if this run never classified it. */
    public ChangeDisposition of(FieldChange change) {
        return change == null ? null : byChange.get(change);
    }

    /** How many changes ended with {@code disposition}. */
    public int count(ChangeDisposition disposition) {
        int n = 0;
        for (ChangeDisposition d : byChange.values()) if (d == disposition) n++;
        return n;
    }

    /**
     * Ids of changes whose outcome is any of {@code dispositions}.
     * Changes with a null id are skipped — they cannot be acked or re-pulled by id anyway.
     */
    public Set<UUID> idsWith(ChangeDisposition... dispositions) {
        Set<ChangeDisposition> wanted = Set.of(dispositions);
        Set<UUID> out = new HashSet<>();
        for (Map.Entry<FieldChange, ChangeDisposition> e : byChange.entrySet()) {
            if (!wanted.contains(e.getValue())) continue;
            UUID id = e.getKey().getId();
            if (id != null) out.add(id);
        }
        return out;
    }

    /** How many changes were classified at all. */
    public int size() {
        return byChange.size();
    }

    /**
     * The outcome per change ID for this run (Inc 7 — what the durable hub apply-state persists).
     * Changes with a null id are skipped (they cannot be keyed durably). If two instances somehow share
     * an id, the highest-ranked outcome wins — same precedence as {@link #record}, so a DEFERRED never
     * loses to an APPLIED for the same id.
     */
    public Map<UUID, ChangeDisposition> idDispositions() {
        Map<UUID, ChangeDisposition> out = new HashMap<>();
        for (Map.Entry<FieldChange, ChangeDisposition> e : byChange.entrySet()) {
            UUID id = e.getKey().getId();
            if (id == null) continue;
            out.merge(id, e.getValue(), (a, b) -> rank(a) >= rank(b) ? a : b);
        }
        return out;
    }

    @Override
    public String toString() {
        return "DispositionLedger{total=" + size()
                + ", applied=" + count(ChangeDisposition.APPLIED)
                + ", supersededNoop=" + count(ChangeDisposition.NOOP_SUPERSEDED)
                + ", deferred=" + count(ChangeDisposition.DEFERRED)
                + ", deadLetter=" + count(ChangeDisposition.DEAD_LETTER)
                + ", failedRetryable=" + count(ChangeDisposition.FAILED_RETRYABLE) + "}";
    }
}
