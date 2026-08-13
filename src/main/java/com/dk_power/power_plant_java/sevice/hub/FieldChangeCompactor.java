package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.HubChangeApplyStateRepo;
import com.dk_power.power_plant_java.sevice.sync.HubApplyStateSink;
import com.dk_power.power_plant_java.sevice.sync.SyncOrder;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Log compaction (retention fix): keep ONLY the latest FieldChange per (entityType, entityId, fieldName),
 * deleting superseded ones. With the latest of every field always retained, any node — however long it
 * was offline — catches up by a normal incremental pull (the pruned-changes silent-loss can't occur),
 * AND high-churn fields (e.g. ShiftDay.lastSyncedAt) collapse to a single row instead of accumulating.
 *
 * <p>Two safety rules are the whole game:
 * <ul>
 *   <li><b>Concurrency-safe delete.</b> The compactor identifies the exact superseded row ids and deletes
 *       them BY ID ({@link FieldChangeRepository#deleteByIdIn}). It never issues a "delete everything but
 *       the max" predicate over the live table, so a change inserted concurrently — which was never in the
 *       id list — can never be deleted. In the worst race a key transiently keeps two rows; the next run
 *       collapses it.</li>
 *   <li><b>Apply-state gate.</b> A superseded value is deleted only once its REPLACEMENT (the SyncOrder
 *       latest) is confirmed APPLIED/NOOP_SUPERSEDED in {@code hub_change_apply_state} (Inc 7). If the
 *       latest is a change the hub could not yet apply (a deferred FK/relationship), the older applied
 *       value is the hub's actual current state and is kept until the latest converges. This ties
 *       compaction to the durable apply-state, so it requires {@code sync.hub.durable-apply-state-enabled}
 *       (which itself requires apply-lww) — compaction is INERT otherwise (logged at ERROR).</li>
 * </ul>
 *
 * <p><b>The {@code _entity_} CREATE/DELETE markers are deliberately EXCLUDED and this is load-bearing —
 * do NOT compact them.</b> Keeping every entity's CREATE marker means a fresh/catching-up node always
 * has it (and the pull is timestamp-ordered, so the early CREATE applies before later field/DELETE
 * changes) — the entity can always be (re)built, so compacting real fields can never strand them. It
 * also means DELETE tombstones survive indefinitely, so a node offline any length of time still learns
 * about deletions (closing the delete-miss gap). Compacting {@code _entity_} would reintroduce exactly
 * the stranding/tombstone blockers this design avoids. The accumulation is bounded (one CREATE per live
 * entity, plus one DELETE per deleted entity) and small.
 *
 * <p>Runs in its own nightly schedule, after the age-prune slot and the apply-state cleanup, flag-gated
 * (default off). Physical file space is reclaimed separately (H2 never shrinks its file on delete — pair
 * with the SHUTDOWN DEFRAG maintenance tooling in scripts/database/).
 */
@Component
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class FieldChangeCompactor {

    private final FieldChangeRepository fieldChangeRepository;
    private final HubChangeApplyStateRepo applyStateRepo;
    // The gate reads apply-state, which is ONLY maintained when the sink is truly active (durable AND
    // apply-lww). Depend on the sink's own predicate so compaction can't run against a frozen gate.
    private final HubApplyStateSink applyStateSink;
    private final TransactionTemplate transactionTemplate;

    @Value("${sync.hub.log-compaction-enabled:false}")
    private boolean compactionEnabled;
    @Value("${sync.hub.compaction-page-size:200}")
    private int pageSize;
    @Value("${sync.hub.compaction-delete-batch:500}")
    private int deleteBatch;
    // A key whose latest change has NO apply-state row (never tracked — the pre-durable-apply-state
    // backlog — or its terminal-good row was aged out by Inc 7's apply-state cleanup) is compactable once
    // the latest is older than this: by then any deferral would have long since resolved (deferred-max-age
    // is 24h) to applied or dead-lettered, and a dead-lettered latest KEEPS a (non-terminal-good) row so
    // it is excluded here. Default 7 days ≥ the reconcile window, so freshly-enabled hubs don't
    // age-compact a change the startup reconcile hasn't yet applied+tracked.
    @Value("${sync.hub.compaction-min-age-hours:168}")
    private long minAgeHours;

    // OR-Set: owning-side @ManyToMany membership is an LWW-Element-Set — its per-element ADD/REMOVE history
    // is NOT whole-field-superseded, so keeping only the SyncOrder-latest change (and deleting the rest)
    // would drop a concurrently-added element from the log. A catching-up/fresh node replaying the
    // compacted log would then be missing that element (each concurrent add carries only its OWN element in
    // newValue). When the OR-Set is on, membership fields are therefore EXCLUDED from compaction — like the
    // _entity_ CREATE markers. When it is off, M2M is whole-set LWW and compacting to the latest is correct.
    @Value("${sync.membership.orset.enabled:false}")
    private boolean membershipOrsetEnabled;

    private final AtomicBoolean inFlight = new AtomicBoolean(false);

    public FieldChangeCompactor(FieldChangeRepository fieldChangeRepository,
                                HubChangeApplyStateRepo applyStateRepo,
                                HubApplyStateSink applyStateSink,
                                PlatformTransactionManager txManager) {
        this.fieldChangeRepository = fieldChangeRepository;
        this.applyStateRepo = applyStateRepo;
        this.applyStateSink = applyStateSink;
        this.transactionTemplate = new TransactionTemplate(txManager);
    }

    /**
     * Active only when enabled AND the durable apply-state it gates on is genuinely being maintained.
     * {@code sink.isDurableEnabled()} is {@code durable && apply-lww} — checking only the durable flag
     * would let compaction run against a FROZEN gate when apply-lww is off (the sink stops writing).
     */
    public boolean isActive() {
        return compactionEnabled && applyStateSink.isDurableEnabled();
    }

    @PostConstruct
    void warnIfMisconfigured() {
        if (compactionEnabled && !applyStateSink.isDurableEnabled()) {
            log.error("sync.hub.log-compaction-enabled=true but the durable apply-state is not active "
                    + "(needs sync.hub.durable-apply-state-enabled=true AND sync.hub.apply-lww-enabled=true) "
                    + "— compaction is INERT. It gates deletion on the apply-state disposition (never delete "
                    + "a superseded value whose replacement isn't confirmed applied); without a maintained "
                    + "apply-state there is no valid gate, so it does nothing.");
        }
    }

    // Cadence is a property so an operator can run compaction more often than nightly (e.g. hourly on a
    // high-churn hub) WITHOUT a redeploy. Default keeps the original once-a-night behavior. NOTE: each run
    // does a full GROUP BY ... HAVING COUNT>1 candidate scan over FIELD_CHANGE, so this is a table-scan cost
    // — cheap nightly, non-trivial hourly on a large log. Inline/per-apply compaction was deliberately
    // REJECTED (it would inject an N+1 SELECT + DELETE into the apply transaction, coupling a compaction
    // H2 lock-timeout to a full entity-apply rollback for zero space benefit — H2 only reclaims file space
    // on DEFRAG regardless). Tune this cron instead when fresher collapse is wanted.
    @Scheduled(cron = "${sync.hub.compaction-cron:0 45 3 * * ?}")
    public void scheduledCompaction() {
        if (!isActive()) return;
        runCompaction();
    }

    /** Single-flight full pass over all compactable keys. Idempotent — safe to re-run. */
    public void runCompaction() {
        if (!isActive()) return;
        if (!inFlight.compareAndSet(false, true)) {
            log.debug("hub.compaction already in flight — skipping");
            return;
        }
        long start = System.currentTimeMillis();
        long totalDeleted = 0;
        try {
            // Offset paging: deleting rows drops keys below count>1 so the candidate set shrinks; a key
            // skipped/repeated across a page boundary is harmless (idempotent) and caught next run.
            int page = 0;
            int maxPages = 1_000_000; // runaway backstop
            while (page < maxPages) {
                List<Object[]> keys = fieldChangeRepository.findCompactionCandidateKeys(
                        PageRequest.of(page, pageSize));
                if (keys.isEmpty()) break;
                totalDeleted += compactKeys(keys);
                page++;
            }
            log.info("hub.compaction.complete deleted={} superseded row(s) in {} ms",
                    totalDeleted, System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.error("hub.compaction failed: {}", e.getMessage(), e);
        } finally {
            inFlight.set(false);
        }
    }

    private long compactKeys(List<Object[]> keys) {
        // Per key: find the SyncOrder-latest row; the rest are compaction victims (only once the latest is
        // safe to keep as the sole survivor — the gate below).
        List<UUID> latestIds = new ArrayList<>();
        Map<UUID, List<UUID>> victimsByLatest = new HashMap<>();
        Map<UUID, Instant> latestTsById = new HashMap<>();

        for (Object[] key : keys) {
            String entityType = (String) key[0];
            Long entityId = (Long) key[1];
            String fieldName = (String) key[2];

            List<FieldChange> rows = fieldChangeRepository.findAllForKey(entityType, entityId, fieldName);
            if (rows.size() <= 1) continue; // raced away since the candidate query

            // OR-Set membership fields are NOT compactable — each per-element ADD/REMOVE must survive in the
            // log or a catching-up node loses a concurrently-added element. (The candidate query can't see
            // relationshipType per key; skip here where the flag and the rows are both available.)
            if (membershipOrsetEnabled && rows.stream().anyMatch(r -> "ManyToMany".equals(r.getRelationshipType()))) {
                continue;
            }

            FieldChange latest = rows.stream().max(SyncOrder.TOTAL).orElse(null);
            if (latest == null || latest.getId() == null) continue;

            List<UUID> victims = new ArrayList<>();
            for (FieldChange r : rows) {
                if (r.getId() != null && !r.getId().equals(latest.getId())) victims.add(r.getId());
            }
            if (victims.isEmpty()) continue;

            latestIds.add(latest.getId());
            victimsByLatest.put(latest.getId(), victims);
            latestTsById.put(latest.getId(), latest.getTimestamp());
        }
        if (latestIds.isEmpty()) return 0;

        // Gate a key's compaction on its LATEST being safe to keep as the sole survivor:
        //  - terminal-good in apply-state (durably applied / no-op-superseded), OR
        //  - terminal DEAD_LETTER (the hub permanently gave up applying it): the latest is never a victim,
        //    so a catching-up node still pulls it; its older predecessors will never become the effective
        //    value again, so collapsing that history reclaims the dead weight instead of pinning it forever.
        //    This is the primary balloon fix — high-churn fields on soft-deleted/absent entities dead-letter
        //    on apply, and the terminal-good-only gate kept their ENTIRE churn history indefinitely, OR
        //  - has NO apply-state row AND is older than minAgeHours. That covers changes the apply-state
        //    never tracked (the pre-durable backlog) or whose terminal-good row was aged out.
        // Still (correctly) pinned: a TRACKED latest that is non-terminal (DEFERRED / FAILED_RETRYABLE /
        // PENDING) — those are in-flight and either resolve to terminal-good or escalate to DEAD_LETTER, at
        // which point they compact by one of the branches above.
        Set<UUID> terminalGood = new HashSet<>(applyStateRepo.findTerminalGoodIds(latestIds));
        Set<UUID> deadLetter = new HashSet<>(applyStateRepo.findDeadLetterIds(latestIds));
        Set<UUID> tracked = new HashSet<>(applyStateRepo.findExistingChangeIds(latestIds));
        Instant graceCutoff = Instant.now().minus(minAgeHours, ChronoUnit.HOURS);

        // For a DEAD_LETTER latest we collapse the churn history, but NOT a terminal-good predecessor: if an
        // earlier change to this field was APPLIED, that value is the hub's real current state, and a node
        // whose snapshot predates it (or that replays the log) would diverge to the CREATE default if it were
        // dropped. Keep those victims; drop the rest. In the balloon case — churn on a soft-deleted/absent
        // entity — nothing ever applied, so all victims are dropped and only the latest remains. Queried in
        // bounded batches because a single stuck key's victim set can be large.
        List<UUID> deadLetterVictims = new ArrayList<>();
        for (UUID latestId : latestIds) {
            if (deadLetter.contains(latestId)) deadLetterVictims.addAll(victimsByLatest.get(latestId));
        }
        Set<UUID> terminalGoodVictims = new HashSet<>();
        for (int i = 0; i < deadLetterVictims.size(); i += deleteBatch) {
            terminalGoodVictims.addAll(applyStateRepo.findTerminalGoodIds(
                    deadLetterVictims.subList(i, Math.min(i + deleteBatch, deadLetterVictims.size()))));
        }

        List<UUID> toDelete = new ArrayList<>();
        for (UUID latestId : latestIds) {
            List<UUID> victims = victimsByLatest.get(latestId);
            boolean latestIsEffectiveValue = terminalGood.contains(latestId)
                    || (!tracked.contains(latestId)
                        && latestTsById.get(latestId) != null
                        && latestTsById.get(latestId).isBefore(graceCutoff));
            if (latestIsEffectiveValue) {
                toDelete.addAll(victims);                       // latest IS the effective value → collapse all
            } else if (deadLetter.contains(latestId)) {
                for (UUID v : victims) {                         // keep any APPLIED predecessor (hub's real value)
                    if (!terminalGoodVictims.contains(v)) toDelete.add(v);
                }
            }
        }
        if (toDelete.isEmpty()) return 0;

        long deleted = 0;
        for (int i = 0; i < toDelete.size(); i += deleteBatch) {
            List<UUID> batch = toDelete.subList(i, Math.min(i + deleteBatch, toDelete.size()));
            try {
                // Delete the superseded FieldChange rows AND their apply-state in one tx, so compaction never
                // just migrates bloat into hub_change_apply_state (DEAD_LETTER apply-state is never aged out).
                Integer n = transactionTemplate.execute(st -> {
                    int fc = fieldChangeRepository.deleteByIdIn(batch);
                    applyStateRepo.deleteByChangeIdIn(batch);
                    return fc;
                });
                if (n != null) deleted += n;
            } catch (Exception e) {
                // Each batch is its own short transaction, so a lock clash with a live syncExchange (H2
                // takes a table-level write lock) or any transient error costs only this batch — skip it
                // and let the next nightly run collapse those keys. Compaction is idempotent, so nothing
                // is lost by retrying later.
                log.warn("hub.compaction delete batch of {} skipped (retry next run): {}",
                        batch.size(), e.getMessage());
            }
        }
        return deleted;
    }
}
