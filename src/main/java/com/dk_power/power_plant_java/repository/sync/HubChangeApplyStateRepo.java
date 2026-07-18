package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.HubChangeApplyState;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Durable hub apply-state (Inc 7). All mutations are MONOTONIC compare-and-set updates: a terminal-good
 * disposition (APPLIED / NOOP_SUPERSEDED) or DEAD_LETTER is never overwritten by a retryable one, so a
 * late-running {@code bumpRetryable} (which the plan runs OUTSIDE the apply lock) can never clobber a
 * row the rescan already flipped to APPLIED.
 */
public interface HubChangeApplyStateRepo extends JpaRepository<HubChangeApplyState, UUID> {

    /** Which of these change ids already have an apply-state row (so co-commit A only inserts new ones). */
    @Query("SELECT s.changeId FROM HubChangeApplyState s WHERE s.changeId IN :ids")
    List<UUID> findExistingChangeIds(@Param("ids") Collection<UUID> ids);

    /**
     * Co-commit B — flip a change to a TERMINAL disposition (APPLIED / NOOP_SUPERSEDED / DEAD_LETTER).
     * Only touches a still-retryable row, so the first terminal wins and terminals are sticky. Called
     * inside the entity-apply transaction so entity state and this flip commit or roll back together.
     */
    @Modifying
    @Query("UPDATE HubChangeApplyState s SET s.disposition = :disposition, s.appliedAt = :now "
            + "WHERE s.changeId = :changeId "
            + "AND s.disposition IN ('PENDING', 'DEFERRED', 'FAILED_RETRYABLE')")
    int flipToTerminal(@Param("changeId") UUID changeId,
                       @Param("disposition") String disposition,
                       @Param("now") Instant now);

    /**
     * A real apply FAILURE (rollback) — advance the bounded retry budget. Monotonic: only a non-terminal
     * row is touched. Runs in its own transaction so the attempts increment survives the apply rollback
     * that produced it.
     */
    @Modifying
    @Query("UPDATE HubChangeApplyState s SET s.disposition = 'FAILED_RETRYABLE', "
            + "s.attempts = s.attempts + 1, s.lastAttemptAt = :now "
            + "WHERE s.changeId = :changeId "
            + "AND s.disposition IN ('PENDING', 'DEFERRED', 'FAILED_RETRYABLE')")
    int bumpFailed(@Param("changeId") UUID changeId, @Param("now") Instant now);

    /**
     * A dependency-wait (parent not present yet) — NOT a failure, so attempts is left alone (a slow
     * parent must not burn the child's budget; DEFERRED is aged out by firstSeenAt instead). Monotonic.
     */
    @Modifying
    @Query("UPDATE HubChangeApplyState s SET s.disposition = 'DEFERRED', s.lastAttemptAt = :now "
            + "WHERE s.changeId = :changeId "
            + "AND s.disposition IN ('PENDING', 'DEFERRED', 'FAILED_RETRYABLE')")
    int bumpDeferred(@Param("changeId") UUID changeId, @Param("now") Instant now);

    /** Terminal give-up. Monotonic: only escalates a still-retryable row. */
    @Modifying
    @Query("UPDATE HubChangeApplyState s SET s.disposition = 'DEAD_LETTER', s.lastAttemptAt = :now "
            + "WHERE s.changeId = :changeId "
            + "AND s.disposition IN ('PENDING', 'DEFERRED', 'FAILED_RETRYABLE')")
    int markDeadLetter(@Param("changeId") UUID changeId, @Param("now") Instant now);

    /**
     * Rescan-eligible rows, split retry budget:
     * <ul>
     *   <li>PENDING — never attempted (crash-before-apply); always retry.</li>
     *   <li>FAILED_RETRYABLE — a real failure; retry while attempts is under the cap.</li>
     *   <li>DEFERRED — a dependency-wait; retry while still within the (much larger) age window.</li>
     * </ul>
     */
    @Query("SELECT s FROM HubChangeApplyState s WHERE "
            + "s.disposition = 'PENDING' "
            + "OR (s.disposition = 'FAILED_RETRYABLE' AND s.attempts < :maxAttempts) "
            + "OR (s.disposition = 'DEFERRED' AND s.firstSeenAt >= :deferredCutoff) "
            // FAIRNESS: least-recently-attempted first (never-attempted rows fall back to firstSeenAt,
            // which is always set). Every re-apply stamps lastAttemptAt, so a processed row rotates to the
            // BACK — without this ORDER BY the query returned the SAME first page every cycle (arbitrary PK
            // order), so with a large backlog the head kept being re-ground while the tail was starved and
            // never attempted at all.
            + "ORDER BY COALESCE(s.lastAttemptAt, s.firstSeenAt) ASC")
    List<HubChangeApplyState> findRescanEligible(@Param("maxAttempts") int maxAttempts,
                                                 @Param("deferredCutoff") Instant deferredCutoff,
                                                 Pageable pageable);

    /**
     * FAIRNESS: stamp {@code lastAttemptAt} on a STILL-PENDING row the rescan just attempted that ended
     * with NO disposition (a ledger-totality gap). bumpRetryable never touches such a row (it isn't in the
     * ledger), so without this its {@code lastAttemptAt} stays null and it keeps sorting to the head of the
     * fairness order, re-starving the scan. Stamping rotates it to the back; the PENDING give-up valve then
     * ages it out by {@code firstSeenAt}. Only touches a still-PENDING row (never re-opens a terminal).
     */
    @Modifying
    @Query("UPDATE HubChangeApplyState s SET s.lastAttemptAt = :now "
            + "WHERE s.changeId = :changeId AND s.disposition = 'PENDING'")
    int touchPendingAttempt(@Param("changeId") UUID changeId, @Param("now") Instant now);

    /**
     * PENDING give-up valve: a PENDING row aged past its (large) window that HAS been attempted at least
     * once (lastAttemptAt not null). With the fairness ordering every PENDING is attempted within minutes,
     * so a row still PENDING this long after being tried has been re-applied many times yet never produced
     * a disposition (a ledger-totality gap that will never self-resolve) — escalate it so PENDING, like
     * DEFERRED/FAILED_RETRYABLE, finally has a give-up path instead of retrying forever.
     * <p>The {@code lastAttemptAt IS NOT NULL} guard is load-bearing: a never-attempted PENDING is a
     * crash-before-apply row (the D7 case this whole durable path exists to recover). If the hub was
     * offline longer than the window, such a row is old by wall-clock but has never had its retry —
     * escalateExhausted runs BEFORE the retry pass, so without this guard it would be dead-lettered on the
     * next boot instead of applied. Requiring a prior attempt makes the valve fire only on rows the scan
     * has genuinely failed to resolve.
     */
    @Query("SELECT s FROM HubChangeApplyState s WHERE s.disposition = 'PENDING' "
            + "AND s.firstSeenAt < :pendingCutoff AND s.lastAttemptAt IS NOT NULL")
    List<HubChangeApplyState> findPendingExpired(@Param("pendingCutoff") Instant pendingCutoff, Pageable pageable);

    /**
     * Operator cleanup (C): bulk-escalate one entity type's stranded orphans to DEAD_LETTER — clears a
     * KNOWN-stale backlog (e.g. ShiftDay changes whose entity was never applied before the registration
     * gap was fixed, and which re-sync fresh from the source node) without waiting for the per-row age-out
     * to grind through 200/cycle. Guards, so it can only finalize give-up on genuinely-stuck rows:
     * <ul>
     *   <li>{@code firstSeenAt < cutoff} (age-floored ≥ 1h by the caller) — never a just-received change;</li>
     *   <li>{@code lastAttemptAt IS NOT NULL} — the SAME load-bearing guard as findPendingExpired: never
     *       abandon a NEVER-attempted crash-before-apply row (the fairness rescan attempts the whole backlog
     *       within minutes, turning genuinely-stuck orphans into attempted DEFERRED/FAILED rows this catches,
     *       while a never-tried row is left for its first retry);</li>
     *   <li>disposition IN the non-terminal set — monotonic, never re-opens a terminal.</li>
     * </ul>
     */
    @Modifying
    @Query("UPDATE HubChangeApplyState s SET s.disposition = 'DEAD_LETTER', s.lastAttemptAt = :now "
            + "WHERE s.entityType = :entityType AND s.firstSeenAt < :cutoff AND s.lastAttemptAt IS NOT NULL "
            + "AND s.disposition IN ('PENDING', 'DEFERRED', 'FAILED_RETRYABLE')")
    int deadLetterStaleOrphansByType(@Param("entityType") String entityType,
                                     @Param("cutoff") Instant cutoff, @Param("now") Instant now);

    /** FAILED_RETRYABLE that has exhausted its attempt budget — escalate to DEAD_LETTER + dead-letter table. */
    @Query("SELECT s FROM HubChangeApplyState s WHERE s.disposition = 'FAILED_RETRYABLE' AND s.attempts >= :maxAttempts")
    List<HubChangeApplyState> findFailedExhausted(@Param("maxAttempts") int maxAttempts, Pageable pageable);

    /** DEFERRED that has aged past its window — the parent never arrived; escalate to DEAD_LETTER. */
    @Query("SELECT s FROM HubChangeApplyState s WHERE s.disposition = 'DEFERRED' AND s.firstSeenAt < :deferredCutoff")
    List<HubChangeApplyState> findDeferredExpired(@Param("deferredCutoff") Instant deferredCutoff, Pageable pageable);

    long countByDisposition(String disposition);

    /**
     * Which of these change ids are TERMINAL-GOOD (the hub durably applied them). Compaction of a field
     * deletes a superseded value only once its REPLACEMENT (the SyncOrder-latest change) is confirmed
     * APPLIED/NOOP_SUPERSEDED here — otherwise, if the latest is a still-deferred change that never
     * applies, deleting the older applied value would erase the hub's actual current state.
     */
    @Query("SELECT s.changeId FROM HubChangeApplyState s WHERE s.changeId IN :ids "
            + "AND s.disposition IN ('APPLIED', 'NOOP_SUPERSEDED')")
    List<UUID> findTerminalGoodIds(@Param("ids") Collection<UUID> ids);

    /** Cleanup: terminal-good rows older than the cutoff (the change has long since converged). */
    @Modifying
    @Query("DELETE FROM HubChangeApplyState s WHERE s.disposition IN ('APPLIED', 'NOOP_SUPERSEDED') "
            + "AND s.appliedAt < :cutoff")
    int deleteTerminalGoodBefore(@Param("cutoff") Instant cutoff);
}
