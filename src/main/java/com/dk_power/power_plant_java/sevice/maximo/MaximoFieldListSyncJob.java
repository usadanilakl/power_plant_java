package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

/**
 * Periodic reconciliation between {@link FieldListItem} rows and their Maximo records
 * (SR + WO). Hub-only.
 *
 * Transactional design (post-codex round 2):
 *   - NO class-level or method-level {@code @Transactional} on the scheduled entry
 *     points. Each per-row operation runs inside its own REQUIRES_NEW tx via
 *     {@link TransactionTemplate} so one row's rollback cannot discard sibling rows.
 *   - Backfill loops pass IDs, NOT entities, between tx boundaries. Each per-row tx
 *     re-fetches inside itself, keeping the entity managed. Cancel path uses the
 *     deleted-inclusive lookup so soft-deleted rows survive the {@code @Where} filter.
 *   - Status reconcile uses an atomic conditional UPDATE ({@code updateStatusIfNotTerminal})
 *     instead of read-modify-save, closing the stale-poll-vs-COMP race.
 *   - Startup catch-up clears its flag only when BOTH poll passes succeeded, so a
 *     partial failure doesn't permanently lose the wide-window semantics.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnExpression(
        "'${maximo.api-key:}'.length() > 0 "
        + "and '${maximo.field-list.enabled:false}' == 'true' "
        + "and '${sync.role:}' == 'hub'")
public class MaximoFieldListSyncJob {

    private final MaximoFieldListBridge bridge;
    private final MaximoServiceRequestAdapter srAdapter;
    private final MaximoWorkOrderAdapter woAdapter;
    private final FieldListItemRepo repo;
    private final com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo attachmentRepo;
    private final MaximoAttachmentSyncService attachmentSync;
    private final PlatformTransactionManager txManager;

    @Value("${maximo.field-list.backfill-batch-size:20}")
    private int backfillBatchSize;

    @Value("${maximo.field-list.status-poll-page-size:200}")
    private int statusPollPageSize;

    @Value("${maximo.field-list.status-poll-lookback-min:30}")
    private int statusPollLookbackMin;

    @Value("${maximo.field-list.startup-catchup-lookback-min:1440}")
    private int startupCatchupLookbackMin;

    private static final DateTimeFormatter MAXIMO_LOCAL_DT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private static final ZoneId PLANT_TZ = ZoneId.of("America/Chicago");

    /** REQUIRES_NEW per-row template. See class javadoc for rationale. */
    private TransactionTemplate perRowTx;

    @PostConstruct
    void init() {
        this.perRowTx = new TransactionTemplate(txManager);
        this.perRowTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /** True until the first poll tick's BOTH passes succeed. See {@link #pollStatuses}. */
    private volatile boolean catchupPending = true;

    // ==================== Backfill ====================

    @Scheduled(fixedDelayString = "${maximo.field-list.backfill-interval-ms:300000}",
            initialDelayString = "${maximo.field-list.backfill-initial-delay-ms:60000}")
    public void backfillPending() {
        try {
            // Fetch just IDs in each list — entities returned here would detach at fetch
            // tx commit and merge back through @Where on downstream save, silently losing
            // soft-deleted cancel-pending rows. Each per-row tx re-fetches by id.
            List<Long> needsCreateIds = fetchIdsInNewTx(() ->
                    idsOf(repo.findByMaximoSyncPendingTrueOrderByIdAsc()));
            List<Long> needsCancelIds = fetchIdsInNewTx(() ->
                    idsOf(repo.findDeletedWithPendingCancel()));
            List<Long> needsCompleteIds = fetchIdsInNewTx(() ->
                    idsOf(repo.findByMaximoCompletePendingTrueOrderByIdAsc()));
            // Pending attachment uploads scoped to FieldListItem parents. Handled by the
            // attachmentSync service (parent-must-be-routed check happens inside).
            List<Long> needsAttachIds = fetchIdsInNewTx(() ->
                    attachmentIdsOf(attachmentRepo.findByMaximoAttachPendingTrueAndEntityTypeOrderByIdAsc("FieldListItem")));

            int createdOk = drain(needsCreateIds, backfillBatchSize, false,
                    row -> bridge.submit(row), "create");
            int cancelledOk = drain(needsCancelIds, backfillBatchSize, true,
                    row -> bridge.cancel(row, "Backfill retry"), "cancel");
            int completedOk = drain(needsCompleteIds, backfillBatchSize, false,
                    row -> bridge.complete(row, "Backfill retry"), "complete");
            int attachedOk = drainAttachments(needsAttachIds, backfillBatchSize);

            if (needsCreateIds.size() + needsCancelIds.size() + needsCompleteIds.size() + needsAttachIds.size() > 0) {
                log.info("[MaximoFieldList] Backfill: created {}/{}, cancelled {}/{}, completed {}/{}, uploaded {}/{}",
                        createdOk, needsCreateIds.size(),
                        cancelledOk, needsCancelIds.size(),
                        completedOk, needsCompleteIds.size(),
                        attachedOk, needsAttachIds.size());
            }
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] Backfill tick failed: {}", e.getMessage());
        }
    }

    /** Attachment backfill — each upload runs in its own REQUIRES_NEW tx (uploadOne saves inside). */
    private int drainAttachments(List<Long> attachmentIds, int budget) {
        int remaining = budget;
        int okCount = 0;
        for (Long attId : attachmentIds) {
            if (remaining-- <= 0) break;
            try {
                Boolean ok = perRowTx.execute(status -> {
                    try {
                        return attachmentSync.uploadOne(attId);
                    } catch (RuntimeException perRowEx) {
                        status.setRollbackOnly();
                        log.warn("[MaximoFieldList] Backfill upload failed for attId={}: {}",
                                attId, perRowEx.getMessage());
                        return Boolean.FALSE;
                    }
                });
                if (Boolean.TRUE.equals(ok)) okCount++;
            } catch (RuntimeException txEx) {
                log.warn("[MaximoFieldList] Backfill upload tx commit failed for attId={}: {}",
                        attId, txEx.getMessage());
            }
        }
        return okCount;
    }

    private static List<Long> attachmentIdsOf(List<com.dk_power.power_plant_java.entities.permits.PermitAttachment> rows) {
        List<Long> out = new java.util.ArrayList<>(rows.size());
        for (var r : rows) out.add(r.getId());
        return out;
    }

    /**
     * For each id, open a REQUIRES_NEW tx, re-fetch (deleted-inclusive if flagged), apply
     * {@code op}, return true if the op succeeded. Row A failing rollback-only-marks its
     * own tx, not any wrapping one — sibling rows commit independently.
     */
    private int drain(List<Long> ids, int budget, boolean includeDeleted,
                      Function<FieldListItem, Boolean> op, String label) {
        int remaining = budget;
        int okCount = 0;
        for (Long id : ids) {
            if (remaining-- <= 0) break;
            try {
                Boolean ok = perRowTx.execute(status -> {
                    try {
                        Optional<FieldListItem> found = includeDeleted
                                ? repo.findByIdIncludingDeleted(id)
                                : repo.findById(id);
                        if (found.isEmpty()) return Boolean.FALSE;
                        return op.apply(found.get());
                    } catch (RuntimeException perRowEx) {
                        status.setRollbackOnly();
                        log.warn("[MaximoFieldList] Backfill {} failed for id={}: {}",
                                label, id, perRowEx.getMessage());
                        return Boolean.FALSE;
                    }
                });
                if (Boolean.TRUE.equals(ok)) okCount++;
            } catch (RuntimeException txEx) {
                log.warn("[MaximoFieldList] Backfill {} tx commit failed for id={}: {}",
                        label, id, txEx.getMessage());
            }
        }
        return okCount;
    }

    /** Fetch a snapshot of IDs in its own tx, close, return the immutable list. */
    private List<Long> fetchIdsInNewTx(java.util.function.Supplier<List<Long>> fetch) {
        List<Long> result = perRowTx.execute(status -> fetch.get());
        return result == null ? List.of() : result;
    }

    private static List<Long> idsOf(List<FieldListItem> rows) {
        List<Long> out = new ArrayList<>(rows.size());
        for (FieldListItem r : rows) out.add(r.getId());
        return out;
    }

    // ==================== Status poll ====================

    @Scheduled(fixedDelayString = "${maximo.field-list.status-poll-interval-ms:60000}",
            initialDelayString = "${maximo.field-list.status-poll-initial-delay-ms:120000}")
    public void pollStatuses() {
        int effectiveLookbackMin = statusPollLookbackMin;
        if (catchupPending && startupCatchupLookbackMin > 0) {
            effectiveLookbackMin = Math.max(effectiveLookbackMin, startupCatchupLookbackMin);
            log.info("[MaximoFieldList] Startup catch-up: using {}-minute lookback for first poll", effectiveLookbackMin);
        }
        String sincePlantLocal = ZonedDateTime.now(PLANT_TZ)
                .minus(effectiveLookbackMin, ChronoUnit.MINUTES)
                .format(MAXIMO_LOCAL_DT);
        PollResult srResult = pollSrs(sincePlantLocal);
        PollResult woResult = pollWos(sincePlantLocal);
        int totalChanged = srResult.changed + woResult.changed;
        if (totalChanged > 0) {
            log.info("[MaximoFieldList] Status poll: {} SR updates + {} WO updates applied",
                    srResult.changed, woResult.changed);
        }
        // Codex-flagged: only clear catchupPending when BOTH passes actually succeeded.
        // If either threw and the catch swallowed it, we may have missed pre-window changes;
        // keep the wider lookback active until we get one clean tick.
        if (catchupPending && srResult.success && woResult.success) {
            catchupPending = false;
            log.info("[MaximoFieldList] Startup catch-up complete");
        }
    }

    /** A poll pass's outcome. success=true when the entire pass ran without throwing. */
    private record PollResult(int changed, boolean success) {}

    private PollResult pollSrs(String sincePlantLocal) {
        try {
            MaximoServiceRequestCriteria c = new MaximoServiceRequestCriteria();
            c.setStatusdateFrom(sincePlantLocal);
            List<MaximoServiceRequestDto> recent = srAdapter.listByCriteria(c, statusPollPageSize);
            if (recent.isEmpty()) return new PollResult(0, true);
            if (recent.size() >= statusPollPageSize) {
                log.warn("[MaximoFieldList] SR status poll hit page cap ({}); possible truncation", statusPollPageSize);
            }
            int changed = 0;
            int failed = 0;
            for (MaximoServiceRequestDto sr : recent) {
                if (sr.getTicketid() == null) continue;
                ReconcileResult r = reconcileOneInNewTx(MaximoFieldListBridge.REC_TYPE_SR, sr.getTicketid(), sr.getStatus());
                if (r == ReconcileResult.CHANGED) changed++;
                else if (r == ReconcileResult.FAILED) failed++;
            }
            // Any per-row failure taints the pass — otherwise catchupPending could clear
            // while a stale row sits outside the next 30-minute lookback window forever.
            return new PollResult(changed, failed == 0);
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] SR status poll failed: {}", e.getMessage());
            return new PollResult(0, false);
        }
    }

    private PollResult pollWos(String sincePlantLocal) {
        try {
            MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
            c.setStatusdateFrom(sincePlantLocal);
            List<MaximoWorkOrderDto> recent = woAdapter.listByCriteria(c, statusPollPageSize);
            if (recent.isEmpty()) return new PollResult(0, true);
            if (recent.size() >= statusPollPageSize) {
                log.warn("[MaximoFieldList] WO status poll hit page cap ({}); possible truncation", statusPollPageSize);
            }
            int changed = 0;
            int failed = 0;
            for (MaximoWorkOrderDto wo : recent) {
                if (wo.getWonum() == null) continue;
                ReconcileResult r = reconcileOneInNewTx(MaximoFieldListBridge.REC_TYPE_WO, wo.getWonum(), wo.getStatus());
                if (r == ReconcileResult.CHANGED) changed++;
                else if (r == ReconcileResult.FAILED) failed++;
            }
            return new PollResult(changed, failed == 0);
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] WO status poll failed: {}", e.getMessage());
            return new PollResult(0, false);
        }
    }

    /**
     * Per-row reconcile outcome. NO_CHANGE = row was already at fresh status OR terminal
     * guard rejected the write; CHANGED = we actually wrote a new status; FAILED = the
     * per-row tx threw or commit failed. Callers use this to distinguish "no-op successful
     * reconcile" from "reconcile failed, catch-up must not clear".
     */
    private enum ReconcileResult { NO_CHANGE, CHANGED, FAILED }

    /**
     * Per-row reconcile in its own REQUIRES_NEW tx. Fetch → terminal-guard-in-Java → save.
     *
     * MUST use JPA save (not a native UPDATE) so the FieldChangeEntityListener's @PostUpdate
     * fires and the maximoStatus change propagates via CRDT to desktops. A native UPDATE
     * bypasses the listener and desktops never see Maximo's status changes.
     *
     * Race window (poll reading WAPPR then complete() committing COMP then poll writing
     * stale APPR): closed by refetching inside the per-row tx immediately before the
     * decision + save. The window between refetch and save is microseconds in-JVM; the
     * enclosing REQUIRES_NEW ensures no other JPA writer inside the same hub can commit
     * in that window without our tx seeing a version bump (H2 MVCC + READ_COMMITTED).
     * Terminal-guard rejects any downgrade seen either at read time or at save time.
     */
    private ReconcileResult reconcileOneInNewTx(String recordType, String recordId, String freshStatus) {
        if (freshStatus == null) return ReconcileResult.NO_CHANGE;
        try {
            ReconcileResult r = perRowTx.execute(status -> {
                try {
                    Optional<FieldListItem> localOpt = repo.findAndLockByMaximoRecord(recordType, recordId);
                    if (localOpt.isEmpty()) return ReconcileResult.NO_CHANGE; // not from this hub
                    FieldListItem local = localOpt.get();
                    String cur = local.getMaximoStatus();
                    if (freshStatus.equals(cur)) return ReconcileResult.NO_CHANGE;
                    if (isTerminal(cur) && !isTerminal(freshStatus)) {
                        log.debug("[MaximoFieldList] Skipped stale {} status write for {} (local terminal={}, fresh={})",
                                recordType, recordId, cur, freshStatus);
                        return ReconcileResult.NO_CHANGE;
                    }
                    local.setMaximoStatus(freshStatus);
                    repo.save(local); // JPA → fires FieldChangeEntityListener → CRDT sync to desktops
                    return ReconcileResult.CHANGED;
                } catch (RuntimeException perRowEx) {
                    status.setRollbackOnly();
                    log.warn("[MaximoFieldList] Status reconcile failed for {} {}: {}",
                            recordType, recordId, perRowEx.getMessage());
                    return ReconcileResult.FAILED;
                }
            });
            return r == null ? ReconcileResult.FAILED : r;
        } catch (RuntimeException txEx) {
            log.warn("[MaximoFieldList] Status reconcile tx commit failed for {} {}: {}",
                    recordType, recordId, txEx.getMessage());
            return ReconcileResult.FAILED;
        }
    }

    /** Terminal statuses across both SR (CLOSED/CANCELLED) and WO (COMP/CLOSE/CAN). */
    private static boolean isTerminal(String s) {
        if (s == null) return false;
        switch (s.toUpperCase()) {
            case "CLOSED":
            case "CANCELLED":
            case "COMP":
            case "CLOSE":
            case "CAN":
                return true;
            default:
                return false;
        }
    }
}
