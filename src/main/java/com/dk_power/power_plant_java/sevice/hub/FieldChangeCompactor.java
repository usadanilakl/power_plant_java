package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.HubChangeApplyStateRepo;
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
 * <p><b>Scope (Phase 1):</b> only real fields are compacted; the {@code _entity_} CREATE/DELETE markers
 * are left untouched (their tombstone handling is Phase 2). Runs in its own nightly schedule, after the
 * age-prune slot and the apply-state cleanup, all flag-gated (default off).
 */
@Component
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class FieldChangeCompactor {

    private final FieldChangeRepository fieldChangeRepository;
    private final HubChangeApplyStateRepo applyStateRepo;
    private final TransactionTemplate transactionTemplate;

    @Value("${sync.hub.log-compaction-enabled:false}")
    private boolean compactionEnabled;
    // The apply-state gate requires the durable apply-state. Keep the names aligned with Inc 7.
    @Value("${sync.hub.durable-apply-state-enabled:false}")
    private boolean durableApplyStateEnabled;
    @Value("${sync.hub.compaction-page-size:200}")
    private int pageSize;
    @Value("${sync.hub.compaction-delete-batch:500}")
    private int deleteBatch;

    private final AtomicBoolean inFlight = new AtomicBoolean(false);

    public FieldChangeCompactor(FieldChangeRepository fieldChangeRepository,
                                HubChangeApplyStateRepo applyStateRepo,
                                PlatformTransactionManager txManager) {
        this.fieldChangeRepository = fieldChangeRepository;
        this.applyStateRepo = applyStateRepo;
        this.transactionTemplate = new TransactionTemplate(txManager);
    }

    /** Compaction is active only when enabled AND the durable apply-state it gates on is available. */
    public boolean isActive() {
        return compactionEnabled && durableApplyStateEnabled;
    }

    @PostConstruct
    void warnIfMisconfigured() {
        if (compactionEnabled && !durableApplyStateEnabled) {
            log.error("sync.hub.log-compaction-enabled=true but sync.hub.durable-apply-state-enabled=false "
                    + "— compaction is INERT. It gates deletion on the apply-state disposition (never delete "
                    + "a superseded value whose replacement isn't confirmed applied); without the durable "
                    + "apply-state there is no gate, so it does nothing. Enable durable-apply-state.");
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
        // Per key: find the SyncOrder-latest row; the rest are compaction victims (only if the latest is
        // terminal-good, checked in one batch below).
        List<UUID> latestIds = new ArrayList<>();
        Map<UUID, List<UUID>> victimsByLatest = new HashMap<>();

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
        }
        if (latestIds.isEmpty()) return 0;

        // Gate: only compact keys whose LATEST is durably applied (or a no-op supersede).
        Set<UUID> terminalGood = new HashSet<>(applyStateRepo.findTerminalGoodIds(latestIds));

        List<UUID> toDelete = new ArrayList<>();
        for (UUID latestId : terminalGood) {
            List<UUID> v = victimsByLatest.get(latestId);
            if (v != null) toDelete.addAll(v);
        }
        if (toDelete.isEmpty()) return 0;

        long deleted = 0;
        for (int i = 0; i < toDelete.size(); i += deleteBatch) {
            List<UUID> batch = toDelete.subList(i, Math.min(i + deleteBatch, toDelete.size()));
            Integer n = transactionTemplate.execute(st -> fieldChangeRepository.deleteByIdIn(batch));
            if (n != null) deleted += n;
        }
        return deleted;
    }
}
