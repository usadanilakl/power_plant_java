package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Durable, per-change record of whether the HUB has applied an incoming {@link FieldChange} to its own
 * entity state (Inc 7, the D7 fix). Deliberately a PLAIN entity (NOT a {@code BaseIdEntity}) so it
 * carries no sync listener and never itself emits a {@link FieldChange} — it is purely hub-local.
 *
 * <p><b>Why it exists.</b> The hub used to recover apply failures from an in-memory queue
 * ({@code HubSyncService.failedBatches}); a hub restart wiped that queue, leaving a change that was
 * saved + broadcast but never applied to the hub's own entities — permanent, silent hub-state drift.
 * This row is the durable replacement: it is written PENDING in the SAME transaction that saves the
 * {@link FieldChange} (co-commit A), flipped to a terminal disposition in the SAME transaction that
 * applies the entity (co-commit B), and read by a rescan that runs on a timer AND once on startup.
 *
 * <p><b>Keyed by {@code changeId}</b> = {@link FieldChange#getId()} (the stable global UUID from Inc 4),
 * so the record is 1:1 with the change and upserts are idempotent by primary key.
 *
 * <p><b>State machine</b> (monotonic — a terminal state is never overwritten by a retryable one):
 * <pre>
 *   PENDING ─▶ APPLIED | NOOP_SUPERSEDED   (terminal-good; the entity converged)
 *   PENDING ─▶ DEFERRED | FAILED_RETRYABLE (retryable; stays in the rescan set)
 *   DEFERRED | FAILED_RETRYABLE ─▶ DEAD_LETTER (retry budget exhausted; dropped from the scan)
 * </pre>
 * A null ledger outcome is treated as still-PENDING (conservative), never as APPLIED.
 */
@Entity
@Table(name = "hub_change_apply_state", indexes = {
        @Index(name = "idx_hcas_disposition", columnList = "disposition")
})
@Getter
@Setter
@NoArgsConstructor
public class HubChangeApplyState {

    /** Received, not yet applied. The only value that is not a {@code ChangeDisposition} name. */
    public static final String PENDING = "PENDING";

    /** {@link FieldChange#getId()} — the stable global change id (Inc 4). Natural primary key. */
    @Id
    private UUID changeId;

    /**
     * One of {@link #PENDING} or a {@code ChangeDisposition} name
     * (APPLIED / NOOP_SUPERSEDED / DEFERRED / FAILED_RETRYABLE / DEAD_LETTER).
     */
    private String disposition;

    private String entityType;
    private Long entityId;
    private String originMachineId;

    /**
     * Count of real apply FAILURES (rollbacks) only — NOT dependency-waits. A DEFERRED change (parent
     * merely late) must not burn this budget, or a slow-arriving parent would dead-letter its child.
     * DEFERRED is aged out by {@link #firstSeenAt} instead. FAILED_RETRYABLE at attempts &gt;= cap
     * escalates to DEAD_LETTER.
     */
    private int attempts;

    private Instant firstSeenAt;
    private Instant lastAttemptAt;
    private Instant appliedAt;
}
