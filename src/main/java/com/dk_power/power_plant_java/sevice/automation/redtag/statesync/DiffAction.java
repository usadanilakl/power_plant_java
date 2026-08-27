package com.dk_power.power_plant_java.sevice.automation.redtag.statesync;

/**
 * What the reconciler thinks should happen to a scraped Red Tag row when the
 * diff plan is applied. The user can toggle any entry off in the preview UI
 * before submitting — the enum classifies the reconciler's suggestion, it does
 * not commit to it.
 */
public enum DiffAction {

    /** Row exists on Red Tag but no local LOTO could be matched — create one. */
    CREATE,

    /**
     * Local LOTO matched. The row's status / fields differ from local; apply
     * the bypass to bring local into line (jobDescription, requestor, permitStatus,
     * lockBox, redTagNum as applicable).
     */
    UPDATE,

    /**
     * Local LOTO matched a Red Tag row with terminal status (CANCELED / CLOSED)
     * — the reconciler proposes closing the local LOTO to match. Only ever
     * suggested when the scrape was one of the terminal statuses, so a partial
     * ACTIVE scrape never proposes accidental closures.
     */
    CLOSE,

    /**
     * The row cannot be paired confidently: it looks like it might match one or
     * more local LOTOs by fuzzy job-description similarity, but no strong
     * (lotoNumber, boxNumber) match exists. The user has to pair or ignore.
     */
    ORPHAN
}
