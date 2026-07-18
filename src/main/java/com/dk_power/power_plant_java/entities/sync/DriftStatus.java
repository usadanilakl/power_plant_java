package com.dk_power.power_plant_java.entities.sync;

/** Lifecycle of a {@link DriftRecord}: open until either the user resolves it or a later scan sees it converge. */
public enum DriftStatus {
    /** Detected and outstanding. */
    FLAGGED,
    /** The user has seen it and chosen to leave it (still counts as drift, but no longer nags). */
    ACKNOWLEDGED,
    /** Resolved — reconciled by the user (accept hub/local) or auto-closed when a later scan found it in sync. */
    RECONCILED
}
