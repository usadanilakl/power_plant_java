package com.dk_power.power_plant_java.sevice.sync;

/**
 * The outcome of attempting to apply a single incoming {@link com.dk_power.power_plant_java.entities.sync.FieldChange}.
 *
 * <p>Today the apply path returns only an {@code int applied} count, which collapses five
 * semantically-different outcomes into "0". Distinguishing them is the prerequisite for
 * correct acknowledgement (Inc 2): a receiver may only ack changes it has genuinely resolved
 * ({@link #APPLIED}, {@link #NOOP_SUPERSEDED}, {@link #DEAD_LETTER}) and must re-pull the rest
 * ({@link #DEFERRED}, {@link #FAILED_RETRYABLE}).
 */
public enum ChangeDisposition {
    /** Applied to entity state. */
    APPLIED,
    /** Rejected by Last-Writer-Wins because a newer-or-equal value already exists — already converged. */
    NOOP_SUPERSEDED,
    /** Could not apply yet because a referenced parent/relationship isn't present — retry on a later cycle. */
    DEFERRED,
    /** Permanent failure that will not resolve by retrying (no service for the type, unknown field). Recorded to the dead-letter table. */
    DEAD_LETTER,
    /** Transient failure (rollback / constraint violation) that may succeed on retry. */
    FAILED_RETRYABLE
}
