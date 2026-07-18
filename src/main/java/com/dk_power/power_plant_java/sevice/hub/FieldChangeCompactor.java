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

    @Scheduled(cron = "0 45 3 * * ?")
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
        //  - has NO apply-state row AND is older than minAgeHours. That covers changes the apply-state
        //    never tracked (the pre-durable backlog) or whose terminal-good row was aged out — after the
        //    grace window a deferral would have resolved, and a dead-lettered latest still HAS a row so it
        //    is (correctly) excluded here, keeping its last-applied predecessor.
        Set<UUID> terminalGood = new HashSet<>(applyStateRepo.findTerminalGoodIds(latestIds));
        Set<UUID> tracked = new HashSet<>(applyStateRepo.findExistingChangeIds(latestIds));
        Instant graceCutoff = Instant.now().minus(minAgeHours, ChronoUnit.HOURS);

        List<UUID> toDelete = new ArrayList<>();
        for (UUID latestId : latestIds) {
            boolean compactable = terminalGood.contains(latestId)
                    || (!tracked.contains(latestId)
                        && latestTsById.get(latestId) != null
                        && latestTsById.get(latestId).isBefore(graceCutoff));
            if (compactable) toDelete.addAll(victimsByLatest.get(latestId));
        }
        if (toDelete.isEmpty()) return 0;

        long deleted = 0;
        for (int i = 0; i < toDelete.size(); i += deleteBatch) {
            List<UUID> batch = toDelete.subList(i, Math.min(i + deleteBatch, toDelete.size()));
            try {
                Integer n = transactionTemplate.execute(st -> fieldChangeRepository.deleteByIdIn(batch));
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
