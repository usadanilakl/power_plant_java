package com.dk_power.power_plant_java.sevice.automation.redtag.statesync;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * One line in a {@link DiffPlan}. Describes exactly one proposed action against
 * one scraped Red Tag row.
 *
 * <p>The frontend renders these grouped by {@link #action}. Every field on this
 * DTO is round-trippable: the user may edit {@link #jobDescription},
 * {@link #requestor}, {@link #lockBox}, or {@link #localLotoId} in the preview
 * before submitting. The server re-derives the effective change set from
 * whatever the user submits — the reconciler's original suggestion is only a
 * starting point.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiffEntry {

    /** Stable client-side key so the preview UI can reorder without losing per-row edit state. */
    private String key;

    /** What the reconciler proposes. The user may switch action to IGNORE via the {@code skip} toggle. */
    private DiffAction action;

    /**
     * When {@code true} the entry stays visible in the preview UI but is NOT applied.
     * Set by the user via a per-row toggle (or by defaulting orphans to skipped).
     */
    private boolean skip;

    // --- Red Tag side (source of truth for the scrape) ----------------------

    /** Red Tag's LOTO number as OCR'd. May be blank when OCR could not read it. */
    private String redTagLotoNumber;
    /** Red Tag lock box number as OCR'd. */
    private String redTagLockBox;
    /** Red Tag job description as OCR'd. */
    private String redTagJobDescription;
    /** Red Tag requestor as OCR'd. */
    private String redTagRequestor;

    // --- Local side (matched, or null when action == CREATE / ORPHAN) --------

    /** Matched local LOTO id, null when no match or when the user hasn't paired an orphan yet. */
    private Long localLotoId;
    private String localPermitNumber;
    private String localPermitStatus;
    private String localJobDescription;
    private String localRequestor;
    private Integer localBoxNumber;
    private String localRedTagNum;

    /**
     * How the reconciler matched (or would have matched) a local LOTO to this row.
     * One of RED_TAG_NUMBER / LOCK_BOX / FUZZY_JOB_DESCRIPTION / NONE.
     */
    private String matchStrategy;

    /**
     * When {@link #action} == ORPHAN, up to three candidate local LOTO ids the
     * user may want to pair to. Ordered by descending similarity score.
     */
    private List<Long> candidateLocalLotoIds = new ArrayList<>();

    /**
     * Which fields the reconciler thinks will change on apply. Advisory only —
     * used to shade "diff" chips in the preview UI. Populated only for UPDATE.
     */
    private List<String> changedFields = new ArrayList<>();

    /** Free-text note about the entry — surfaced beneath the row in the UI. */
    private String reason;
}
