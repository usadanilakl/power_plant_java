package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/**
 * The write side of the durable hub apply-state (Inc 7). Implemented only on the hub
 * ({@code @ConditionalOnProperty(sync.role=hub)}); {@link FieldSyncService} runs on clients too and
 * injects this optionally, so on a client the reference is null and the durable path is simply absent.
 *
 * <p>Three writes enforce the invariant "a FieldChange saved on the hub is applied to the hub's own
 * entity IFF its apply-state row reads APPLIED/NOOP_SUPERSEDED":
 * <ul>
 *   <li>{@link #ensurePending} — co-commit A: a PENDING row per newly-saved change, written in the SAME
 *       transaction that saves the {@link FieldChange}. So no saved change ever lacks a durable
 *       "needs apply" marker, even if the hub crashes before the apply thread runs.</li>
 *   <li>{@link #persistTerminal} — co-commit B: flips PENDING → APPLIED/NOOP_SUPERSEDED (or DEAD_LETTER),
 *       written in the SAME transaction that applies the entity, so entity state and apply-state can
 *       never disagree across a crash. Monotonic (a terminal is never re-opened).</li>
 *   <li>{@link #bumpRetryable} — advances the retry budget for DEFERRED/FAILED_RETRYABLE changes in its
 *       OWN transaction, so the attempts increment survives the apply rollback that produced it. A
 *       compare-and-set so it can never clobber a terminal the rescan set concurrently.</li>
 * </ul>
 */
public interface HubApplyStateSink {

    /**
     * Whether the durable apply-state path is active (hub AND {@code sync.hub.durable-apply-state-enabled}).
     * When false the sink is inert and the hub keeps its legacy in-memory retry queue — the two recovery
     * paths are mutually exclusive so a change is never handled by both.
     */
    boolean isDurableEnabled();

    /** Co-commit A. Idempotent by changeId — only inserts a PENDING row where none exists. */
    void ensurePending(Collection<FieldChange> savedChanges);

    /** Co-commit B. {@code dispositions} may contain all outcomes; only terminals are persisted here. */
    void persistTerminal(Map<UUID, ChangeDisposition> dispositions);

    /** Advance retry budget for the retryable subset (DEFERRED / FAILED_RETRYABLE) of {@code dispositions}. */
    void bumpRetryable(Map<UUID, ChangeDisposition> dispositions);
}
