package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;

import java.util.Comparator;

/**
 * The ONE total order over {@link FieldChange}s, used at every conflict-resolution point.
 *
 * <p>Last-writer-wins needs a rule that (a) picks a winner for ANY two changes and (b) reaches the
 * SAME winner on every machine. A bare timestamp comparison fails both: equal timestamps are common
 * (millisecond writes, clock granularity), and on a tie the old code either kept whichever row the DB
 * happened to return or compared only machine ids — so two nodes could pick opposite winners for the
 * identical pair and diverge permanently. That is the "coin-flip" bug: a tie silently decided whose
 * edit survives.
 *
 * <p>This defines a strict total order: newer timestamp wins; ties broken by origin machine id, then
 * by the change's global id. All three keys are stable and identical on every node — timestamp and
 * originMachineId travel with the change, and the id is now global (it is no longer re-minted on
 * receive) — so every node computes the same verdict.
 *
 * <p><b>This does not fix clock skew.</b> It makes nodes AGREE on a winner; it does not guarantee the
 * winner is the one a human would call "latest" when two clocks disagree. That is a separate concern.
 */
public final class SyncOrder {

    private SyncOrder() {}

    /**
     * Total order: greater == wins. timestamp, then originMachineId, then id.
     * Null ids sort first (a change without a global identity loses a tie to one that has it); this is
     * only reachable for legacy/local rows and keeps the order strict either way.
     */
    public static final Comparator<FieldChange> TOTAL =
            Comparator.comparing(FieldChange::getTimestamp)
                    .thenComparing(FieldChange::getOriginMachineId,
                            Comparator.nullsFirst(Comparator.naturalOrder()))
                    .thenComparing(FieldChange::getId,
                            Comparator.nullsFirst(Comparator.naturalOrder()));

    /**
     * Should {@code incoming} replace {@code local}? True iff there is no local change, or incoming
     * strictly outranks local by the total order. Equal (the same change re-delivered) returns false —
     * no pointless re-apply.
     */
    public static boolean incomingWins(FieldChange incoming, FieldChange local) {
        return local == null || TOTAL.compare(incoming, local) > 0;
    }

    /** The winner of two changes under the total order (for reduce/merge). Ties are the same change. */
    public static FieldChange max(FieldChange a, FieldChange b) {
        if (a == null) return b;
        if (b == null) return a;
        return TOTAL.compare(a, b) >= 0 ? a : b;
    }
}
