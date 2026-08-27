package com.dk_power.power_plant_java.sevice.automation.redtag.statesync;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * The reconciliation plan handed to the preview UI: for one scrape, the flat
 * list of {@link DiffEntry entries} the reconciler proposes to apply.
 *
 * <p>Grouping into "Create / Update / Close / Orphan" panes happens in the UI —
 * the server just returns a flat, ordered list and the entry's own {@link DiffAction}.
 * That keeps the wire shape trivial and lets the UI decide layout freely.
 *
 * <p>The plan is stateless / disposable: the server does NOT persist it. If
 * the operator re-scrapes before submitting, the previous plan is discarded.
 * Apply-time re-derives the effective mutation from whatever the client posts
 * back, so a stale server-side plan can't cause a mis-apply.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiffPlan {
    private RedTagStatus status;
    private Instant builtAt;
    private List<DiffEntry> entries = new ArrayList<>();

    /**
     * Number of local LOTOs the reconciler could match to at least one row.
     * Purely informational — the UI shows "N rows matched / K unmatched".
     */
    private int matchedCount;
    /** Number of local LOTOs the reconciler could not find on Red Tag. */
    private int localOnlyCount;
}
