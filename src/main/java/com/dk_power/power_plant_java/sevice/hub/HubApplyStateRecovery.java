package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.HubChangeApplyState;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.HubChangeApplyStateRepo;
import com.dk_power.power_plant_java.sevice.sync.ChangeDisposition;
import com.dk_power.power_plant_java.sevice.sync.DispositionLedger;
import com.dk_power.power_plant_java.sevice.sync.FieldSyncService;
import com.dk_power.power_plant_java.sevice.sync.HubApplyStateSink;
import com.dk_power.power_plant_java.sevice.sync.SyncDeadLetterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * Durable, restart-safe recovery for the hub apply-state (Inc 7 — the D7 fix). Replaces the in-memory
 * {@code failedBatches}/{@code pendingEntityRetry} queue that a hub restart used to wipe.
 *
 * <p>Two triggers share ONE single-flight guard so a PENDING row is never processed twice at once:
 * <ul>
 *   <li>{@link #onStartup} (once, on {@code ApplicationReadyEvent}) — the actual restart fix: it re-applies
 *       everything the previous process saved-but-never-applied, then reconciles any change that was saved
 *       while the durable path was off (e.g. across the flag flip that turned it on).</li>
 *   <li>{@link #scheduledRescan} (every 60s) — steady-state retry of DEFERRED/FAILED_RETRYABLE changes.</li>
 * </ul>
 *
 * <p>Every re-apply runs in its OWN transaction ({@link FieldSyncService#applyIncomingChangesTracked} uses
 * REQUIRES_NEW internally) so a single poison change can neither roll back nor charge the retry budget of
 * its neighbours. Retry budgets are SPLIT: a real failure (FAILED_RETRYABLE) burns a bounded attempt
 * count; a dependency-wait (DEFERRED) is aged out by a much larger time window, so a slow-arriving parent
 * never dead-letters its child.
 */
@Component
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubApplyStateRecovery {

    private final HubChangeApplyStateRepo repo;
    private final FieldChangeRepository fieldChangeRepository;
    private final FieldSyncService fieldSyncService;
    private final HubApplyStateSink sink;
    private final SyncDeadLetterService syncDeadLetterService;
    private final SyncConfig syncConfig;
    private final TransactionTemplate transactionTemplate;

    @Value("${sync.hub.durable-apply-state-enabled:false}")
    private boolean durableEnabled;
    @Value("${sync.hub.apply-max-attempts:15}")
    private int maxAttempts;
    @Value("${sync.hub.deferred-max-age-minutes:1440}")
    private long deferredMaxAgeMinutes;
    @Value("${sync.hub.rescan-page-size:200}")
    private int rescanPageSize;
    @Value("${sync.hub.reconcile-window-hours:24}")
    private long reconcileWindowHours;
    @Value("${sync.hub.apply-state-retention-days:7}")
    private long applyStateRetentionDays;

    private final AtomicBoolean rescanInFlight = new AtomicBoolean(false);

    public HubApplyStateRecovery(HubChangeApplyStateRepo repo,
                                 FieldChangeRepository fieldChangeRepository,
                                 FieldSyncService fieldSyncService,
                                 HubApplyStateSink sink,
                                 SyncDeadLetterService syncDeadLetterService,
                                 SyncConfig syncConfig,
                                 PlatformTransactionManager transactionManager) {
        this.repo = repo;
        this.fieldChangeRepository = fieldChangeRepository;
        this.fieldSyncService = fieldSyncService;
        this.sink = sink;
        this.syncDeadLetterService = syncDeadLetterService;
        this.syncConfig = syncConfig;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    /** The restart fix: on boot, reconcile orphans then rescan everything not yet durably applied. */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        if (!durableEnabled) return;
        log.info("hub.apply_state.startup durable-apply-state ENABLED — reconciling orphans + rescanning "
                + "(maxAttempts={}, deferredMaxAgeMin={})", maxAttempts, deferredMaxAgeMinutes);
        try {
            reconcileOrphans();
        } catch (Exception e) {
            log.error("hub.apply_state.reconcile_failed: {}", e.getMessage(), e);
        }
        runRescan();
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 120_000)
    public void scheduledRescan() {
        if (!durableEnabled) return;
        runRescan();
    }

    /**
     * Keep hub_change_apply_state bounded — H2 never compacts, and the table is 1:1 with the hot
     * FieldChange table. Terminal-good rows (the change long since converged) are safe to drop; the
     * FieldChange row is retained/pruned on its own schedule. Runs after HubSyncService.cleanupOldChanges.
     */
    @Scheduled(cron = "0 30 3 * * ?")
    public void cleanupApplyState() {
        if (!durableEnabled) return;
        Instant cutoff = Instant.now().minus(Duration.ofDays(applyStateRetentionDays));
        Integer deleted = transactionTemplate.execute(st -> repo.deleteTerminalGoodBefore(cutoff));
        if (deleted != null && deleted > 0) {
            log.info("hub.apply_state.cleanup removed {} terminal-good row(s) older than {} days",
                    deleted, applyStateRetentionDays);
        }
    }

    /** Single-flight over BOTH triggers (startup + scheduled). */
    public void runRescan() {
        if (!rescanInFlight.compareAndSet(false, true)) {
            log.debug("hub.apply_state.rescan already in flight — skipping");
            return;
        }
        long start = System.currentTimeMillis();
        try {
            escalateExhausted();

            Instant deferredCutoff = Instant.now().minus(Duration.ofMinutes(deferredMaxAgeMinutes));
            Pageable page = PageRequest.of(0, rescanPageSize);
            List<HubChangeApplyState> eligible = repo.findRescanEligible(maxAttempts, deferredCutoff, page);
            if (eligible.isEmpty()) return;

            log.info("hub.apply_state.rescan reapplying {} change(s)", eligible.size());
            int applied = 0;
            for (HubChangeApplyState s : eligible) {
                if (reapplyOne(s.getChangeId())) applied++;
            }
            log.info("hub.apply_state.rescan done: {}/{} now terminal-good in {} ms",
                    applied, eligible.size(), System.currentTimeMillis() - start);
        } finally {
            rescanInFlight.set(false);
        }
    }

    /** Re-apply one change in its own transaction. Returns true if it reached a terminal-good state. */
    private boolean reapplyOne(UUID changeId) {
        FieldChange change = fieldChangeRepository.findById(changeId).orElse(null);
        if (change == null) {
            // The FieldChange was pruned but its apply-state row survived — nothing to replay. Drop the row.
            transactionTemplate.executeWithoutResult(st -> repo.deleteById(changeId));
            return false;
        }
        try {
            // Per-change isolation: applyIncomingChangesTracked runs in its own REQUIRES_NEW tx and
            // co-commits the terminal disposition (persistTerminal) with the entity write.
            DispositionLedger ledger = fieldSyncService.applyIncomingChangesTracked(List.of(change), true);
            // Advance the retry budget for anything still non-terminal (own tx, survives an apply rollback).
            sink.bumpRetryable(ledger.idDispositions());
            ChangeDisposition d = ledger.of(change);
            return d == ChangeDisposition.APPLIED || d == ChangeDisposition.NOOP_SUPERSEDED;
        } catch (Exception e) {
            log.error("hub.apply_state.reapply_failed changeId={}: {}", changeId, e.getMessage());
            sink.bumpRetryable(Map.of(changeId, ChangeDisposition.FAILED_RETRYABLE));
            return false;
        }
    }

    /** Give-up valve: dead-letter changes that exhausted their (split) retry budget. */
    private void escalateExhausted() {
        Instant deferredCutoff = Instant.now().minus(Duration.ofMinutes(deferredMaxAgeMinutes));
        Pageable page = PageRequest.of(0, rescanPageSize);
        for (HubChangeApplyState s : repo.findFailedExhausted(maxAttempts, page)) {
            deadLetter(s, "FAILED_RETRYABLE attempts=" + s.getAttempts() + " >= " + maxAttempts);
        }
        for (HubChangeApplyState s : repo.findDeferredExpired(deferredCutoff, page)) {
            deadLetter(s, "DEFERRED older than " + deferredMaxAgeMinutes + " min — parent never arrived");
        }
    }

    private void deadLetter(HubChangeApplyState s, String why) {
        transactionTemplate.executeWithoutResult(st -> {
            FieldChange change = fieldChangeRepository.findById(s.getChangeId()).orElse(null);
            if (change != null) syncDeadLetterService.recordUnresolvedAfterRetries(change, s.getAttempts());
            repo.markDeadLetter(s.getChangeId(), Instant.now());
        });
        log.warn("hub.apply_state.dead_letter changeId={} entityType={} entityId={} — {}",
                s.getChangeId(), s.getEntityType(), s.getEntityId(), why);
    }

    /**
     * Backfill PENDING rows for recently-received changes that have NO apply-state row — the changes
     * saved while the durable path was off (notably across the flag flip that turns it on, which needs a
     * restart and wipes the old in-memory queue). Bounded to a recent window so this never scans all
     * history; re-applying an already-applied change on the next rescan is a harmless NOOP.
     */
    private void reconcileOrphans() {
        Instant since = Instant.now().minus(Duration.ofHours(reconcileWindowHours));
        List<FieldChange> recent = fieldChangeRepository.findRecentIncomingChanges(syncConfig.getMachineId(), since);
        if (recent.isEmpty()) return;

        Set<UUID> ids = recent.stream().map(FieldChange::getId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) return;
        Set<UUID> tracked = new HashSet<>(repo.findExistingChangeIds(ids));
        List<FieldChange> orphans = recent.stream()
                .filter(c -> c.getId() != null && !tracked.contains(c.getId()))
                .collect(Collectors.toList());
        if (orphans.isEmpty()) return;

        log.warn("hub.apply_state.reconcile seeding {} orphan change(s) received in the last {}h with no "
                + "apply-state row (saved while durable path was off) — they will be rescanned",
                orphans.size(), reconcileWindowHours);
        transactionTemplate.executeWithoutResult(st -> sink.ensurePending(orphans));
    }
}
