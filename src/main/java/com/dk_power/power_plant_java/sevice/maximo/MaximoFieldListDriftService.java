package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.admin.MaximoBulkCancelPreviewDto;
import com.dk_power.power_plant_java.dto.admin.MaximoBulkCancelResultDto;
import com.dk_power.power_plant_java.dto.admin.MaximoFieldListDriftDto;
import com.dk_power.power_plant_java.dto.admin.MaximoFieldListDriftRowDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Builds the drift snapshot for the Maximo Field List bridge. Not gated by the same
 * feature flag as the bridge itself — the admin panel is safe to show even when the
 * feature is off (all buckets will just be zero-count), and hiding it based on config
 * would create a mystery panel that appears/disappears from the UI without explanation.
 *
 * All queries respect {@code @Where(deleted != true)} EXCEPT the cancel-pending query,
 * which explicitly targets deleted rows.
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class MaximoFieldListDriftService {

    private final FieldListItemRepo repo;
    private final PermitAttachmentRepo attachmentRepo;
    // Bridge + attachment sync are Optional because the Maximo feature is flag-gated
    // (@ConditionalOnExpression). When the feature is off, retry endpoints degrade
    // to a no-op with a "feature disabled" message rather than throwing NPE.
    private final Optional<MaximoFieldListBridge> bridge;
    private final Optional<MaximoAttachmentSyncService> attachmentSync;
    private final NgValueService valueService;

    /**
     * ListTypes the bridge is configured to route to Maximo. Same source-of-truth as
     * {@code MaximoFieldListBridge.routeToWoTypesRaw} — we read the property directly
     * instead of asking the bridge bean because the bridge is Optional (absent when
     * the feature is off, and the drift panel must still compute this bucket in that
     * case — a "you have unrouted items" signal is useful pre-enable too).
     */
    @org.springframework.beans.factory.annotation.Value("${maximo.field-list.route-to-wo-types:}")
    private String routeToWoTypesRaw;
    private java.util.List<String> shouldRouteListTypes = java.util.Collections.emptyList();

    @jakarta.annotation.PostConstruct
    void parseRouteTypes() {
        if (routeToWoTypesRaw == null || routeToWoTypesRaw.isBlank()) return;
        java.util.List<String> parsed = new java.util.ArrayList<>();
        for (String t : routeToWoTypesRaw.split(",")) {
            String trimmed = t == null ? "" : t.trim();
            if (!trimmed.isEmpty()) parsed.add(trimmed);
        }
        this.shouldRouteListTypes = java.util.Collections.unmodifiableList(parsed);
    }

    public MaximoFieldListDriftService(FieldListItemRepo repo,
                                       PermitAttachmentRepo attachmentRepo,
                                       Optional<MaximoFieldListBridge> bridge,
                                       Optional<MaximoAttachmentSyncService> attachmentSync,
                                       NgValueService valueService) {
        this.repo = repo;
        this.attachmentRepo = attachmentRepo;
        this.bridge = bridge;
        this.attachmentSync = attachmentSync;
        this.valueService = valueService;
    }

    /**
     * Terminal Maximo statuses — a record in one of these is done as far as Maximo is
     * concerned. Any local row still in an open status against a terminal Maximo status
     * is drift the admin should see.
     */
    private static final List<String> MAXIMO_TERMINAL = List.of(
            MaximoFieldListBridge.SR_STATUS_CANCELLED, // SR: CANCELLED
            "CLOSED",                                   // SR terminal
            MaximoFieldListBridge.WO_STATUS_COMPLETE,  // WO: COMP
            "CLOSE",                                    // WO: CLOSE
            MaximoFieldListBridge.WO_STATUS_CANCELLED  // WO: CAN
    );

    /**
     * Non-terminal WO statuses. Used to flag rows where the local status went to Closed
     * but the WO didn't get its COMP push through (the "wo-completion-status hit but
     * bridge.complete() failed silently" case). Restricted to WO because SR non-terminal
     * status against a local closed row is expected planner-side triage, not drift.
     */
    private static final List<String> MAXIMO_WO_OPEN = List.of(
            "WAPPR", "APPR", "WSCH", "INPRG"
    );

    /**
     * Local FieldListStatus names considered "open" (i.e. not-closed). Matches the same
     * set used by {@code NgFieldListItemService.OPEN_STATUSES} — kept in sync manually,
     * since duplication across a service + drift audit is smaller than pulling a shared
     * constant into a Value-service boundary.
     */
    private static final List<String> LOCAL_OPEN = List.of("Open", "In Progress");

    /** Local FieldListStatus name treated as "closed" for divergence checks. */
    private static final String LOCAL_CLOSED = "Closed";

    /**
     * Build the drift snapshot. {@code sampleLimit} caps how many rows are returned per
     * bucket for drill-down — counts always reflect the full table.
     */
    public MaximoFieldListDriftDto snapshot(int sampleLimit) {
        int cap = Math.max(1, Math.min(sampleLimit, 200));

        List<FieldListItem> createPendingRows = repo.findByMaximoSyncPendingTrueOrderByIdAsc();
        List<FieldListItem> cancelPendingRows = repo.findDeletedWithPendingCancel();
        List<FieldListItem> completePendingRows = repo.findByMaximoCompletePendingTrueOrderByIdAsc();
        List<FieldListItem> maximoClosedLocalOpen = repo.findMaximoClosedLocalOpen(MAXIMO_TERMINAL, LOCAL_OPEN);
        List<FieldListItem> localClosedMaximoOpen = repo.findLocalClosedMaximoOpen(MAXIMO_WO_OPEN, LOCAL_CLOSED);
        List<FieldListItem> localNotInMaximo = shouldRouteListTypes.isEmpty()
                ? java.util.Collections.emptyList()
                : repo.findLocalNotInMaximo(shouldRouteListTypes);

        MaximoFieldListDriftDto out = new MaximoFieldListDriftDto();
        out.setComputedAt(Instant.now());
        out.setTotalRoutedToMaximo(repo.countByMaximoRecordIdIsNotNull());
        out.setCreatePending(bucket(createPendingRows, cap));
        out.setCancelPending(bucket(cancelPendingRows, cap));
        out.setCompletePending(bucket(completePendingRows, cap));
        out.setAttachmentUploadPendingCount(
                attachmentRepo.countByMaximoAttachPendingTrueAndEntityType("FieldListItem"));
        out.setMaximoClosedLocalOpen(bucket(maximoClosedLocalOpen, cap));
        out.setLocalClosedMaximoOpen(bucket(localClosedMaximoOpen, cap));
        out.setLocalNotInMaximo(bucket(localNotInMaximo, cap));
        return out;
    }

    private MaximoFieldListDriftDto.BucketDto bucket(List<FieldListItem> rows, int cap) {
        MaximoFieldListDriftDto.BucketDto b = new MaximoFieldListDriftDto.BucketDto();
        b.setCount(rows == null ? 0 : rows.size());
        b.setOldestAgeDays(oldestAgeDays(rows));
        b.setSamples(toRowDtos(rows, cap));
        return b;
    }

    private static Long oldestAgeDays(List<FieldListItem> rows) {
        if (rows == null || rows.isEmpty()) return null;
        LocalDateTime oldest = null;
        for (FieldListItem r : rows) {
            LocalDateTime m = r.getDateModified();
            if (m == null) continue;
            if (oldest == null || m.isBefore(oldest)) oldest = m;
        }
        if (oldest == null) return null;
        long days = ChronoUnit.DAYS.between(oldest, LocalDateTime.now());
        return Math.max(0L, days);
    }

    private static List<MaximoFieldListDriftRowDto> toRowDtos(List<FieldListItem> rows, int cap) {
        if (rows == null || rows.isEmpty()) return Collections.emptyList();
        // Sort newest-first for drill-down UX (buckets fetched by different queries with
        // different orderings normalize here). Cancel-pending rows come deleted=true from
        // a native query and may lack dateModified; nulls sort last.
        List<FieldListItem> sorted = new ArrayList<>(rows);
        sorted.sort((a, b) -> {
            LocalDateTime da = a.getDateModified();
            LocalDateTime db = b.getDateModified();
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });
        List<MaximoFieldListDriftRowDto> out = new ArrayList<>(Math.min(cap, sorted.size()));
        int taken = 0;
        for (FieldListItem r : sorted) {
            if (taken++ >= cap) break;
            out.add(toRowDto(r));
        }
        return out;
    }

    private static MaximoFieldListDriftRowDto toRowDto(FieldListItem r) {
        MaximoFieldListDriftRowDto d = new MaximoFieldListDriftRowDto();
        d.setId(r.getId());
        d.setTitle(r.getTitle());
        d.setListTypeName(r.getListType() == null ? null : r.getListType().getName());
        d.setLocalStatus(r.getStatus() == null ? null : r.getStatus().getName());
        d.setMaximoRecordType(r.getMaximoRecordType());
        d.setMaximoRecordId(r.getMaximoRecordId());
        d.setMaximoStatus(r.getMaximoStatus());
        d.setMaximoSyncPending(r.getMaximoSyncPending());
        d.setMaximoCancelPending(r.getMaximoCancelPending());
        d.setMaximoCompletePending(r.getMaximoCompletePending());
        d.setDateModified(r.getDateModified());
        d.setSubmitterName(r.getSubmitterName());
        d.setDeleted(r.getDeleted());
        return d;
    }

    // ==================== Retry / resolve endpoints for admin drift panel ====================

    /**
     * Result of a resolve/retry action. {@code ok} = the operation was attempted and reported
     * success; {@code message} carries a human-readable note for the admin toast. Feature-off
     * ({@code bridge.isEmpty()}) returns ok=false with an explanatory message rather than throwing.
     */
    public record ResolveResult(boolean ok, String message) {}

    /**
     * Retry Maximo submit for a row stuck in create-pending. Loads the (live, managed) entity in a
     * fresh writable tx so the bridge's own repo.save inside submit() persists — REQUIRES_NEW here
     * matches the AFTER_COMMIT event-listener pattern the bridge was designed for.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResolveResult retrySubmit(Long id) {
        if (bridge.isEmpty()) return new ResolveResult(false, "Maximo feature disabled");
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) return new ResolveResult(false, "Row not found: " + id);
        boolean ok = bridge.get().submit(entity);
        return new ResolveResult(ok, ok
                ? "Submitted (or already routed) to Maximo"
                : "Retry failed — flag stays pending; see hub log for details");
    }

    /**
     * Retry Maximo cancel for a soft-deleted row stuck in cancel-pending. Uses the
     * deleted-inclusive lookup because @Where(deleted=false) hides these from findById.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResolveResult retryCancel(Long id) {
        if (bridge.isEmpty()) return new ResolveResult(false, "Maximo feature disabled");
        FieldListItem entity = repo.findByIdIncludingDeleted(id).orElse(null);
        if (entity == null) return new ResolveResult(false, "Row not found: " + id);
        boolean ok = bridge.get().cancel(entity, "Manual retry from Drift Center");
        return new ResolveResult(ok, ok ? "Cancelled in Maximo" : "Retry failed — flag stays pending");
    }

    /**
     * Retry Maximo WO COMP for a row stuck in complete-pending. No-op for SR-routed rows (bridge
     * short-circuits on non-WO recordType).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResolveResult retryComplete(Long id) {
        if (bridge.isEmpty()) return new ResolveResult(false, "Maximo feature disabled");
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) return new ResolveResult(false, "Row not found: " + id);
        boolean ok = bridge.get().complete(entity, "Manual retry from Drift Center");
        return new ResolveResult(ok, ok
                ? "Completed WO in Maximo (or already terminal)"
                : "Retry failed — flag stays pending or row is SR-routed");
    }

    /**
     * Retry a single stuck attachment upload. Called with the {@code PermitAttachment} id
     * (not the parent FieldListItem id) so the admin can retry a specific failed doclink
     * from the attachment-pending bucket drill-down.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResolveResult retryAttachment(Long attachmentId) {
        if (attachmentSync.isEmpty()) return new ResolveResult(false, "Maximo feature disabled");
        PermitAttachment att = attachmentRepo.findById(attachmentId).orElse(null);
        if (att == null) return new ResolveResult(false, "Attachment not found: " + attachmentId);
        try {
            attachmentSync.get().uploadOne(attachmentId);
            return new ResolveResult(true, "Attachment upload retried");
        } catch (RuntimeException e) {
            return new ResolveResult(false, "Retry failed: " + e.getMessage());
        }
    }

    /**
     * Reconcile a Maximo-closed / local-open divergence by adopting Maximo's terminal state into
     * the local FieldListItem. Sets local status to the configured completion status so the row
     * drops out of the "open" buckets. Does NOT touch Maximo (that side is already terminal).
     * Used when the admin has seen that Maximo COMP'd/CLOSED/CANCELLED the record via a route
     * outside our bridge (ops closed the SR manually, etc.) and just wants the local mirror to
     * catch up.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResolveResult acceptMaximoStatus(Long id) {
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) return new ResolveResult(false, "Row not found: " + id);
        String maxStatus = entity.getMaximoStatus();
        if (maxStatus == null || !MAXIMO_TERMINAL.contains(maxStatus)) {
            return new ResolveResult(false, "Maximo status is not terminal: " + maxStatus);
        }
        // Adopt the equivalent local closed status. The bridge's wo-completion-status is what
        // the LOCAL side calls "closed"; that's what should be reflected here regardless of
        // whether Maximo COMP'd, CLOSED, or CANCELLED — from the local user's perspective the
        // row is done. Value must exist (created lazily on first use, same as other flows).
        entity.setStatus(valueService.createValue("FieldListStatus", LOCAL_CLOSED));
        repo.save(entity);
        return new ResolveResult(true, "Local status adopted from Maximo (" + maxStatus + " → " + LOCAL_CLOSED + ")");
    }

    /**
     * Reconcile a local-closed / Maximo-open divergence by re-pushing the local Closed state to
     * Maximo (i.e. re-firing the COMP call). Same as retryComplete but marks the row's complete-
     * pending flag first so the backfill loop keeps retrying if the immediate attempt fails.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ResolveResult pushLocalClose(Long id) {
        if (bridge.isEmpty()) return new ResolveResult(false, "Maximo feature disabled");
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) return new ResolveResult(false, "Row not found: " + id);
        entity.setMaximoCompletePending(Boolean.TRUE);
        repo.save(entity);
        boolean ok = bridge.get().complete(entity, "Manual push from Drift Center");
        return new ResolveResult(ok, ok
                ? "Local Closed pushed to Maximo (WO COMP)"
                : "Push failed — pending flag set, backfill will retry");
    }

    // ==================== Bulk-cancel orphans ====================

    /** Default Maximo statuses the admin usually wants to sweep — the "open on Maximo's side" set. */
    private static final List<String> DEFAULT_ORPHAN_MAXIMO_STATUSES = List.of("WAPPR", "APPR", "WSCH", "INPRG");
    /** Default local statuses the admin usually wants — the "terminal-locally" set. */
    private static final List<String> DEFAULT_ORPHAN_LOCAL_STATUSES = List.of("Closed", "Cancelled");

    /**
     * Preview candidates for the "Bulk-cancel Maximo orphans" admin action. Returns rows
     * matching the caller-picked Maximo statuses AND local statuses — the intersection is
     * "Maximo WO in this state, but locally already done". Common cause: bridge was enabled
     * after items already existed as Closed in H2 → next SP-import / CRDT save fired
     * Submitted → bridge created WOs starting at WAPPR. Dry-read only.
     */
    @Transactional(readOnly = true)
    public MaximoBulkCancelPreviewDto previewOrphans(List<String> maximoStatuses,
                                                     List<String> localStatuses,
                                                     int sampleLimit) {
        List<String> mx = normaliseStatuses(maximoStatuses, DEFAULT_ORPHAN_MAXIMO_STATUSES);
        List<String> loc = normaliseStatuses(localStatuses, DEFAULT_ORPHAN_LOCAL_STATUSES);
        int cap = Math.max(1, Math.min(sampleLimit, 500));
        List<FieldListItem> rows = repo.findMaximoWoOrphans(mx, loc);
        MaximoBulkCancelPreviewDto out = new MaximoBulkCancelPreviewDto();
        out.setCandidateCount(rows.size());
        out.setSamples(toRowDtos(rows, cap));
        out.setMaximoStatuses(mx);
        out.setLocalStatuses(loc);
        return out;
    }

    /**
     * Execute the bulk cancel — for each row matching the same criteria as
     * {@link #previewOrphans}, call {@code bridge.cancel} with a fixed reason. Per-row
     * failures are captured (never abort the whole batch — a single bad WO shouldn't block
     * cleanup of the rest). No-op with attempted=0 when the bridge is off.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public MaximoBulkCancelResultDto bulkCancelOrphans(List<String> maximoStatuses,
                                                       List<String> localStatuses,
                                                       String reason) {
        MaximoBulkCancelResultDto out = new MaximoBulkCancelResultDto();
        out.setFailures(new ArrayList<>());
        if (bridge.isEmpty()) {
            out.setAttempted(0);
            log.warn("[MaximoBulkCancel] Skipped — Maximo bridge is not active on this node.");
            return out;
        }
        List<String> mx = normaliseStatuses(maximoStatuses, DEFAULT_ORPHAN_MAXIMO_STATUSES);
        List<String> loc = normaliseStatuses(localStatuses, DEFAULT_ORPHAN_LOCAL_STATUSES);
        String memo = (reason == null || reason.isBlank())
                ? "Bulk-cancel: erroneous Maximo route on bridge enablement"
                : reason.trim();

        List<FieldListItem> rows = repo.findMaximoWoOrphans(mx, loc);
        out.setAttempted(rows.size());
        int cancelled = 0;
        for (FieldListItem entity : rows) {
            try {
                boolean ok = bridge.get().cancel(entity, memo);
                if (ok) cancelled++;
                else out.getFailures().add(new MaximoBulkCancelResultDto.Failure(
                        entity.getId(), entity.getMaximoRecordId(), "bridge.cancel returned false"));
            } catch (RuntimeException e) {
                out.getFailures().add(new MaximoBulkCancelResultDto.Failure(
                        entity.getId(), entity.getMaximoRecordId(), e.getMessage()));
                log.warn("[MaximoBulkCancel] Cancel failed id={} wonum={}: {}",
                        entity.getId(), entity.getMaximoRecordId(), e.getMessage());
            }
        }
        out.setCancelled(cancelled);
        out.setFailed(out.getFailures().size());
        log.info("[MaximoBulkCancel] Done — attempted={} cancelled={} failed={}",
                out.getAttempted(), out.getCancelled(), out.getFailed());
        return out;
    }

    private static List<String> normaliseStatuses(List<String> input, List<String> fallback) {
        if (input == null || input.isEmpty()) return fallback;
        List<String> cleaned = input.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        return cleaned.isEmpty() ? fallback : cleaned;
    }
}
