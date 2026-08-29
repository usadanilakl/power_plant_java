package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.CreateMaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Bridges {@link FieldListItem} records to Maximo. Routes to either a Service Request
 * (default, planner-triaged intake) or a Work Order (committed work with a specific
 * worktype) based on the row's {@code listType}. Insulation-typed field lists route to
 * WO so ops can close them programmatically when the contractor finishes; other types
 * route to SR so planners triage before ops commits work.
 *
 * All methods are best-effort: any exception from the Maximo API is caught and translated
 * into a "pending" flag on the H2 row for the {@link MaximoFieldListSyncJob} to retry
 * later. Callers get a boolean success indicator but never a thrown exception, so a
 * Maximo outage never blocks the underlying PWA/H2/SP flow.
 *
 * Bean is gated by both {@code maximo.api-key} (parent config) and
 * {@code maximo.field-list.enabled} — leaving either unset makes this bean absent so
 * callers must inject {@code Optional<MaximoFieldListBridge>} and treat it as a no-op
 * when empty.
 */
@Slf4j
@Component
@RequiredArgsConstructor
// Presence-check on maximo.api-key (any non-empty secret) AND explicit opt-in flag AND
// hub-only. The hub-only clause matters: the shared jar runs on the hub and every
// desktop with the same api-key, and rows carry maximoSyncPending across CRDT sync —
// without sync.role=hub, a desktop that receives a pending row would independently
// call bridge.submit() and create a DUPLICATE Maximo record. All Maximo write-side
// beans in this codebase are hub-scoped (FieldListValueSeeder, HubSyncConfig etc.);
// this one follows the same convention.
@ConditionalOnExpression(
        "'${maximo.api-key:}'.length() > 0 "
        + "and '${maximo.field-list.enabled:false}' == 'true' "
        + "and '${sync.role:}' == 'hub'")
public class MaximoFieldListBridge {

    public static final String REC_TYPE_SR = "SR";
    public static final String REC_TYPE_WO = "WO";
    /** WO cancellation status on this Maximo tenant. */
    public static final String WO_STATUS_CANCELLED = "CAN";
    /** SR cancellation status on this Maximo tenant. */
    public static final String SR_STATUS_CANCELLED = "CANCELLED";
    /** WO completion status. */
    public static final String WO_STATUS_COMPLETE = "COMP";

    private final MaximoServiceRequestAdapter srAdapter;
    private final MaximoWorkOrderAdapter woAdapter;
    private final FieldListItemRepo repo;
    /**
     * Looks up the submitter's User row to translate their email into a Maximo personid
     * for the record's {@code reportedby}. Without this, Maximo defaults to whoever the
     * API service account is — every WO/SR from a field list was attributed to that one
     * account instead of the person who actually submitted.
     */
    private final UserRepo userRepo;

    // Ambient-tx model (codex round 2):
    // Every caller of this bridge now wraps in its own transaction:
    //   - MaximoFieldListEventListener runs handlers as AFTER_COMMIT @Transactional
    //   - MaximoFieldListSyncJob wraps each per-row op in perRowTx (REQUIRES_NEW)
    // The bridge just saves into the ambient tx. No REQUIRES_NEW template here —
    // that pattern doesn't work because REQUIRES_NEW suspends the caller's tx and
    // an uncommitted INSERT in that suspended tx isn't visible to the new tx (H2 MVCC
    // and standard isolation levels).

    /**
     * Optional default {@code classstructureid} to attach to every SR created from a
     * field list item. Only applied on the SR path — WO routing uses worktype instead.
     * Leaving blank means Maximo triages SRs without a preset class.
     */
    @Value("${maximo.field-list.classstructureid:}")
    private String defaultClassstructureid;

    /**
     * Comma-separated FieldListType names that should be routed to Maximo as Work Orders
     * (rather than the default SR). Case-insensitive match against {@code listType.name}.
     * Example: {@code Insulation Removal,Painting}. Blank/empty = all types route to SR.
     */
    @Value("${maximo.field-list.route-to-wo-types:}")
    private String routeToWoTypesRaw;

    /**
     * Comma-separated {@code FieldListType:worktype} pairs. Applied ONLY when the row
     * routed to WO — the worktype domain code must exist on the Maximo tenant or the
     * create call will fail. Example: {@code Insulation Removal:INS} (INS is the tenant's
     * insulation worktype code). Types listed in
     * {@code route-to-wo-types} but missing here get a null worktype (Maximo lets that
     * through; ops assigns on triage).
     */
    @Value("${maximo.field-list.wo-worktype-mappings:}")
    private String woWorktypeMappingsRaw;

    private Set<String> routeToWoTypes = Collections.emptySet();
    private Map<String, String> woWorktypeByType = Collections.emptyMap();

    @PostConstruct
    void parseConfig() {
        this.routeToWoTypes = parseCsvSet(routeToWoTypesRaw);
        this.woWorktypeByType = parseCsvKvMap(woWorktypeMappingsRaw);
        log.info("[MaximoFieldList] Bridge active — WO-routed types: {}, worktype mappings: {}",
                routeToWoTypes, woWorktypeByType);
    }

    // ============================== Submit ==============================

    /**
     * Create either a Maximo SR or WO for the given field list item, based on the row's
     * listType and config. On success, stores the returned recordId + href + status +
     * recordType on the entity and clears the sync-pending flag. On failure, sets the
     * sync-pending flag so the backfill loop retries later.
     *
     * Idempotency: if the entity already has a maximoRecordId, this is a no-op that
     * returns true. We rely on the local recordId as the sole dedup key — Maximo has no
     * natural uniqueness constraint on custom-fielded submissions.
     */
    public boolean submit(FieldListItem entity) {
        if (entity == null || entity.getId() == null) return false;
        // Concurrency guard (codex round 3): AFTER_COMMIT listeners handling two Submitted
        // events for the same row (e.g. NgFieldListItemService direct-submit + CRDT sync-apply
        // arriving nearly simultaneously) can both pass the pre-lock recordId==null check and
        // both create a Maximo record → duplicate SR/WO. Take PESSIMISTIC_WRITE on the row so
        // one submit proceeds and the other waits, then sees the id populated and no-ops.
        // Same pattern the status-poll reconcile uses (findAndLockByMaximoRecord).
        FieldListItem locked = repo.findAndLockById(entity.getId()).orElse(null);
        if (locked == null) {
            log.warn("[MaximoFieldList] submit id={} — row disappeared between event and lock", entity.getId());
            return false;
        }
        if (locked.getMaximoRecordId() != null && !locked.getMaximoRecordId().isBlank()) {
            // Already routed by us or a concurrent submit. Clear any stale sync-pending flag
            // left over from a "create-succeeded, save-failed" race (see catch-block below):
            // the record id landing means the record really exists, so pending is a lie that
            // would loop the backfill forever.
            if (Boolean.TRUE.equals(locked.getMaximoSyncPending())) {
                locked.setMaximoSyncPending(Boolean.FALSE);
                try { repo.save(locked); } catch (RuntimeException ignore) { /* backfill retries */ }
            }
            return true;
        }
        // Work with the locked (managed) instance for the rest of the submit — persistCreated
        // and markSyncPending both call repo.save on this reference.
        entity = locked;
        // Wrap the entire submit — including the payload-building helpers — inside try:
        // any NPE from an unexpected entity shape (missing listType, null tag, etc.) must
        // NOT propagate out. This is a best-effort add-on to the PWA submit; an escape
        // here would roll back the caller's @Transactional and turn a benign Maximo hiccup
        // into a lost submission.
        boolean routeWo = shouldRouteToWo(entity);
        String typeName = entity.getListType() == null ? "<null>" : entity.getListType().getName();
        log.info("[MaximoFieldList] ROUTE id={} listType={} → {}",
                entity.getId(), typeName, routeWo ? "WO" : "SR");
        try {
            return routeWo ? createWo(entity) : createSr(entity);
        } catch (RuntimeException e) {
            markSyncPending(entity, e.getMessage());
            log.warn("[MaximoFieldList] Create {} failed for FieldListItem id={}: {}",
                    routeWo ? "WO" : "SR", entity.getId(), e.getMessage());
            return false;
        }
    }

    private boolean shouldRouteToWo(FieldListItem entity) {
        if (routeToWoTypes.isEmpty()) return false;
        if (entity.getListType() == null || entity.getListType().getName() == null) return false;
        return routeToWoTypes.contains(entity.getListType().getName().toLowerCase(Locale.ROOT));
    }

    private boolean createSr(FieldListItem entity) {
        CreateMaximoServiceRequestDto req = buildCreateDto(entity);
        log.info("[MaximoFieldList] SR-SEND id={} description='{}' longDescriptionLen={} classstructureid={} location={} assetnum={}",
                entity.getId(), req.getDescription(),
                req.getLongDescription() == null ? 0 : req.getLongDescription().length(),
                req.getClassstructureid(), req.getLocation(), req.getAssetnum());
        MaximoServiceRequestDto created = srAdapter.create(req);
        if (created == null || created.getTicketid() == null) {
            markSyncPending(entity, "empty SR response");
            return false;
        }
        return persistCreated(entity, REC_TYPE_SR, created.getTicketid(), created.getHref(), created.getStatus());
    }

    private boolean createWo(FieldListItem entity) {
        String worktype = worktypeFor(entity);
        String description = defaultIfBlank(entity.getTitle(), "Field List Report");
        String longDescription = buildLongDescription(entity);
        // Location from the entity (populated by frontend Maximo picker when used).
        // Null falls through to ops-triage assignment.
        String location = entity.getMaximoLocation();
        String reportedby = resolveSubmitterPersonid(entity);
        log.info("[MaximoFieldList] WO-SEND id={} worktype={} description='{}' longDescriptionLen={} location={} reportedby={}",
                entity.getId(), worktype, description,
                longDescription == null ? 0 : longDescription.length(), location, reportedby);
        // Map overload so we can send spi:reportedby alongside the base fields. The 5-arg
        // overload doesn't take reportedby, and omitting it makes Maximo default to the
        // API service account — every field-list WO would be attributed to that one user
        // instead of the actual submitter.
        Map<String, Object> spi = new HashMap<>();
        if (description != null && !description.isBlank()) spi.put("spi:description", description.trim());
        if (longDescription != null && !longDescription.isBlank())
            spi.put("spi:description_longdescription", longDescription.trim());
        if (location != null && !location.isBlank()) spi.put("spi:location", location.trim());
        if (worktype != null && !worktype.isBlank()) spi.put("spi:worktype", worktype.trim());
        if (reportedby != null && !reportedby.isBlank()) spi.put("spi:reportedby", reportedby.trim());
        // Siteid intentionally NOT set — the map overload defaults it to the adapter's default.
        MaximoWorkOrderDto created = woAdapter.create(spi);
        if (created == null || created.getWonum() == null) {
            markSyncPending(entity, "empty WO response");
            return false;
        }
        return persistCreated(entity, REC_TYPE_WO, created.getWonum(), created.getHref(), created.getStatus());
    }

    private String worktypeFor(FieldListItem entity) {
        if (woWorktypeByType.isEmpty() || entity.getListType() == null || entity.getListType().getName() == null)
            return null;
        return woWorktypeByType.get(entity.getListType().getName().toLowerCase(Locale.ROOT));
    }

    private boolean persistCreated(FieldListItem entity, String recordType,
                                   String recordId, String href, String status) {
        // Ambient-tx model: caller (event listener or sync-job perRowTx) has already
        // opened a transaction on our behalf and the entity we received was fetched
        // inside that tx (managed). We just stamp the Maximo state; the caller commits.
        entity.setMaximoRecordType(recordType);
        entity.setMaximoRecordId(recordId);
        entity.setMaximoHref(href);
        entity.setMaximoStatus(status);
        entity.setMaximoSyncPending(Boolean.FALSE);
        try {
            repo.save(entity);
        } catch (RuntimeException saveEx) {
            // Rare: create succeeded (real record exists in Maximo) but persisting the
            // record id failed. FAIL LOUD — the caller's tx will roll back, dropping our
            // pending-flag reset too, but the Maximo record is real and orphaned. Only
            // recovery is a manual H2 patch, so log with the actual id.
            log.error("[MaximoFieldList] CRITICAL: Maximo {} recordId={} created but H2 save failed"
                    + " for FieldListItem id={} localUuid={}. Next backfill tick may create a"
                    + " duplicate unless the id is manually persisted. Save error: {}",
                    recordType, recordId, entity.getId(), entity.getLocalUuid(), saveEx.getMessage());
            throw saveEx; // rethrow so caller's perRowTx rollback fires — safer than silent orphan
        }
        log.info("[MaximoFieldList] Created {} recordId={} for FieldListItem id={} localUuid={}",
                recordType, recordId, entity.getId(), entity.getLocalUuid());
        return true;
    }

    // ============================== Cancel ==============================

    /**
     * Cancel the Maximo record associated with this field list item (called on local delete).
     * No-op if the item was never routed to Maximo. On failure, sets the cancel-pending flag
     * so the backfill loop retries later. Dispatches on {@link FieldListItem#getMaximoRecordType()}
     * — WO uses status "CAN", SR uses "CANCELLED".
     */
    public boolean cancel(FieldListItem entity, String reason) {
        if (entity == null) return false;
        String href = entity.getMaximoHref();
        if (href == null || href.isBlank()) {
            // Never made it to Maximo — nothing to cancel. Clear any stale flag.
            entity.setMaximoCancelPending(Boolean.FALSE);
            return true;
        }
        String recType = entity.getMaximoRecordType();
        try {
            String cancelStatus;
            if (REC_TYPE_WO.equals(recType)) {
                cancelStatus = WO_STATUS_CANCELLED;
                log.info("[MaximoFieldList] WO-CANCEL-SEND id={} wonum={} reason='{}'",
                        entity.getId(), entity.getMaximoRecordId(), reason);
                woAdapter.changeStatus(href, cancelStatus, reason);
            } else {
                // Default to SR treatment for null recordType (backward-compatible with
                // rows created before the WO route existed).
                cancelStatus = SR_STATUS_CANCELLED;
                log.info("[MaximoFieldList] SR-CANCEL-SEND id={} ticketid={} reason='{}'",
                        entity.getId(), entity.getMaximoRecordId(), reason);
                srAdapter.changeStatus(href, cancelStatus, reason);
            }
            entity.setMaximoStatus(cancelStatus);
            entity.setMaximoCancelPending(Boolean.FALSE);
            repo.save(entity);
            log.info("[MaximoFieldList] Cancelled {} recordId={} for FieldListItem id={}",
                    recType == null ? REC_TYPE_SR : recType, entity.getMaximoRecordId(), entity.getId());
            return true;
        } catch (RuntimeException e) {
            entity.setMaximoCancelPending(Boolean.TRUE);
            // Match markSyncPending's pattern — a secondary save failure inside an
            // already-failed path must not escape.
            try {
                repo.save(entity);
            } catch (RuntimeException persistEx) {
                log.warn("[MaximoFieldList] Failed to persist cancel-pending flag for id={}: {}",
                        entity.getId(), persistEx.getMessage());
            }
            log.warn("[MaximoFieldList] Cancel {} failed for FieldListItem id={}: {}",
                    recType == null ? REC_TYPE_SR : recType, entity.getId(), e.getMessage());
            return false;
        }
    }

    // ============================== Complete ==============================

    /**
     * Change the Maximo record status to COMP (WO-only). Called when the local FieldListItem's
     * status transitions to the configured completion status ({@code wo-completion-status},
     * default "Closed"). This is the primary reason for the WO-route: when insulation is
     * installed by a contractor and the row is closed locally, we programmatically COMP
     * the WO so ops sees it drop out of the queue. No-op for SR records — planners drive
     * the SR lifecycle in Maximo.
     */
    public boolean complete(FieldListItem entity, String memo) {
        if (entity == null) return false;
        if (!REC_TYPE_WO.equals(entity.getMaximoRecordType())) return false; // SR path doesn't auto-complete
        String href = entity.getMaximoHref();
        if (href == null || href.isBlank()) {
            // Row is WO-typed but the WO hasn't been created yet (create-and-close ordering
            // race — codex round 3: SP-import of a new row that arrives already-closed
            // publishes both Submitted and ContractorClosed in the same commit; if the close
            // handler runs before the submit handler, href is still null here). Mark pending
            // so the backfill loop retries once the parent has an href.
            if (!Boolean.TRUE.equals(entity.getMaximoCompletePending())) {
                entity.setMaximoCompletePending(Boolean.TRUE);
                try { repo.save(entity); } catch (RuntimeException ignore) { /* backfill retries */ }
            }
            log.info("[MaximoFieldList] complete id={} deferred — no maximoHref yet (pending flag set)",
                    entity.getId());
            return false;
        }
        // Idempotency: if the WO is already at a terminal status, don't try to COMP again.
        // Also clear any stale complete-pending flag so the backfill stops chasing it.
        String cur = entity.getMaximoStatus();
        if (WO_STATUS_COMPLETE.equalsIgnoreCase(cur) || "CLOSE".equalsIgnoreCase(cur) || WO_STATUS_CANCELLED.equalsIgnoreCase(cur)) {
            if (Boolean.TRUE.equals(entity.getMaximoCompletePending())) {
                entity.setMaximoCompletePending(Boolean.FALSE);
                try { repo.save(entity); } catch (RuntimeException ignore) { /* backfill will re-check */ }
            }
            return true;
        }
        try {
            log.info("[MaximoFieldList] WO-COMP-SEND id={} wonum={} memo='{}'",
                    entity.getId(), entity.getMaximoRecordId(), memo);
            woAdapter.changeStatus(href, WO_STATUS_COMPLETE, memo);
            entity.setMaximoStatus(WO_STATUS_COMPLETE);
            entity.setMaximoCompletePending(Boolean.FALSE);
            try { repo.save(entity); } catch (RuntimeException ignore) { /* status poll will re-sync */ }
            log.info("[MaximoFieldList] Completed WO wonum={} for FieldListItem id={}",
                    entity.getMaximoRecordId(), entity.getId());
            return true;
        } catch (RuntimeException e) {
            // Failure path: flag for backfill retry so the WO doesn't stay open forever
            // (codex-flagged: previously we logged and moved on, no retry state).
            entity.setMaximoCompletePending(Boolean.TRUE);
            try {
                repo.save(entity);
            } catch (RuntimeException persistEx) {
                log.warn("[MaximoFieldList] Failed to persist complete-pending flag for id={}: {}",
                        entity.getId(), persistEx.getMessage());
            }
            log.warn("[MaximoFieldList] Complete WO failed for FieldListItem id={}: {}",
                    entity.getId(), e.getMessage());
            return false;
        }
    }

    // ============================== Update fields ==============================

    /**
     * Push editable descriptive fields (title/notes/location/asset) from the FieldListItem down
     * to the corresponding Maximo record. Called after any PWA edit so the two views stay in
     * sync — before this, ONLY status transitions (Closed → COMP) and soft-deletes made it
     * to Maximo; descriptive edits stayed local + SP only.
     *
     * <p>Dispatches on {@code maximoRecordType}: SR uses {@link MaximoServiceRequestAdapter#updateFields}
     * (whitelist MERGE), WO uses {@link MaximoWorkOrderAdapter#updateFields}. Best-effort:
     * on failure we log a warning and return false. No pending flag — the row's local state
     * is durable and the admin drift panel + status-poll reconcile catch the divergence.
     */
    public boolean updateFields(FieldListItem entity) {
        if (entity == null) return false;
        String href = entity.getMaximoHref();
        if (href == null || href.isBlank()) return false; // not routed yet — nothing to update
        String recType = entity.getMaximoRecordType();
        String description = defaultIfBlank(entity.getTitle(), "Field List Report");
        String longDescription = buildLongDescription(entity);
        String location = entity.getMaximoLocation();
        String assetnum = entity.getMaximoAssetnum();
        try {
            if (REC_TYPE_WO.equals(recType)) {
                log.info("[MaximoFieldList] WO-UPDATE-SEND id={} wonum={} desc='{}' loc={} asset={}",
                        entity.getId(), entity.getMaximoRecordId(), description, location, assetnum);
                woAdapter.updateFields(href, description, longDescription, location, assetnum);
            } else {
                // Default to SR when recordType is null (backward compat with pre-WO rows).
                Map<String, String> fields = new HashMap<>();
                fields.put("spi:description", description);
                if (longDescription != null) fields.put("spi:description_longdescription", longDescription);
                if (location != null && !location.isBlank()) fields.put("spi:location", location);
                if (assetnum != null && !assetnum.isBlank()) fields.put("spi:assetnum", assetnum);
                log.info("[MaximoFieldList] SR-UPDATE-SEND id={} ticketid={} fields={}",
                        entity.getId(), entity.getMaximoRecordId(), fields.keySet());
                srAdapter.updateFields(href, fields);
            }
            return true;
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] Update {} failed for FieldListItem id={}: {}",
                    recType == null ? REC_TYPE_SR : recType, entity.getId(), e.getMessage());
            return false;
        }
    }

    // ============================== Worklog append ==============================

    /**
     * Always add a worklog entry to a routed WO — unlike {@code changeStatus} + its
     * {@code ensureWorklogPresent} helper (which skips if any worklog already exists),
     * this method unconditionally writes a new row. Used by the "Save progress" flow so
     * every contractor comment lands on Maximo's worklog history, and by the re-complete
     * flow so a follow-up comment on an already-COMP WO isn't lost.
     *
     * <p>Best-effort: on failure logs a warning and returns false so the caller's other
     * side effects (H2 note append, attachment upload) still run.
     */
    public boolean appendWorklog(FieldListItem entity, String note) {
        if (entity == null || note == null || note.isBlank()) return false;
        if (!REC_TYPE_WO.equals(entity.getMaximoRecordType())) return false;
        String href = entity.getMaximoHref();
        if (href == null || href.isBlank()) return false;
        try {
            woAdapter.reportActuals(href, null, note.trim(), null, "CLIENTNOTE");
            log.info("[MaximoFieldList] Worklog appended to wonum={} for FieldListItem id={}",
                    entity.getMaximoRecordId(), entity.getId());
            return true;
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] appendWorklog failed for id={}: {}", entity.getId(), e.getMessage());
            return false;
        }
    }

    // ============================== Read-back ==============================

    /**
     * Refresh the {@code maximoStatus} field for a specific item by looking up its href.
     * Used for one-off lookups (bulk sync uses the sync-job's paged fetch for efficiency).
     */
    public boolean refreshStatus(FieldListItem entity) {
        if (entity == null || entity.getMaximoHref() == null || entity.getMaximoHref().isBlank()) return false;
        String recType = entity.getMaximoRecordType();
        try {
            String freshStatus;
            if (REC_TYPE_WO.equals(recType)) {
                Optional<MaximoWorkOrderDto> found = woAdapter.findByHref(entity.getMaximoHref());
                if (found.isEmpty()) return false;
                freshStatus = found.get().getStatus();
            } else {
                Optional<MaximoServiceRequestDto> found = srAdapter.findByHref(entity.getMaximoHref());
                if (found.isEmpty()) return false;
                freshStatus = found.get().getStatus();
            }
            if (freshStatus != null && !freshStatus.equals(entity.getMaximoStatus())) {
                entity.setMaximoStatus(freshStatus);
                repo.save(entity);
                log.info("[MaximoFieldList] {} recordId={} status → {}",
                        recType == null ? REC_TYPE_SR : recType, entity.getMaximoRecordId(), freshStatus);
            }
            return true;
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] refreshStatus failed for FieldListItem id={}: {}",
                    entity.getId(), e.getMessage());
            return false;
        }
    }

    // ============================== Helpers ==============================

    private CreateMaximoServiceRequestDto buildCreateDto(FieldListItem entity) {
        CreateMaximoServiceRequestDto req = new CreateMaximoServiceRequestDto();
        // Description = title (Maximo caps at ~100 chars visually; longer values still stick).
        // Fall back to a generic label if the field list arrived with no title, so we never
        // POST an all-blank SR that Maximo rejects with BMXAA4213E.
        req.setDescription(defaultIfBlank(entity.getTitle(), "Field List Report"));
        req.setLongDescription(buildLongDescription(entity));
        req.setReportedby(resolveSubmitterPersonid(entity));
        // Location + assetnum from the entity (populated by the frontend Maximo picker when
        // used). Both null = ops assigns on triage — same behavior as before.
        req.setLocation(entity.getMaximoLocation());
        req.setAssetnum(entity.getMaximoAssetnum());
        if (defaultClassstructureid != null && !defaultClassstructureid.isBlank()) {
            req.setClassstructureid(defaultClassstructureid.trim());
        }
        return req;
    }

    /**
     * Resolve the field list submitter to a Maximo personid so {@code spi:reportedby} is
     * the actual person who submitted, not the API service account (which is Maximo's
     * default when the field is omitted). Match by email first (unique-ish + the field
     * every submitter path fills in), fall back to null so Maximo triage still succeeds
     * on rows whose submitter isn't a known User (external contractor, imported SP row
     * with an unknown author, etc.). Never throws.
     */
    private String resolveSubmitterPersonid(FieldListItem entity) {
        if (entity == null) return null;
        String email = entity.getSubmitterEmail();
        if (email == null || email.isBlank()) return null;
        try {
            User u = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(email.trim());
            if (u == null) return null;
            String personid = u.getMaximoPersonid();
            return (personid == null || personid.isBlank()) ? null : personid;
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] Submitter → personid lookup failed for '{}': {}", email, e.getMessage());
            return null;
        }
    }

    private String buildLongDescription(FieldListItem entity) {
        // Aggregate the field list's rich data into the record's long description so ops
        // sees the whole submission in-context without cross-referencing SharePoint.
        StringBuilder sb = new StringBuilder();
        if (entity.getListType() != null && entity.getListType().getName() != null) {
            sb.append("Type: ").append(entity.getListType().getName()).append('\n');
        }
        if (entity.getLocation() != null && entity.getLocation().getName() != null) {
            sb.append("Location: ").append(entity.getLocation().getName()).append('\n');
        }
        if (entity.getSpecificLocation() != null && !entity.getSpecificLocation().isBlank()) {
            sb.append("Specific location: ").append(entity.getSpecificLocation()).append('\n');
        }
        if (entity.getEquipment() != null && entity.getEquipment().getTagNumber() != null) {
            sb.append("Equipment: ").append(entity.getEquipment().getTagNumber()).append('\n');
        }
        if (entity.getDateObserved() != null && !entity.getDateObserved().isBlank()) {
            sb.append("Observed: ").append(entity.getDateObserved());
            if (entity.getTimeObserved() != null && !entity.getTimeObserved().isBlank()) {
                sb.append(' ').append(entity.getTimeObserved());
            }
            sb.append('\n');
        }
        if (entity.getSubmitterName() != null && !entity.getSubmitterName().isBlank()) {
            sb.append("Submitted by: ").append(entity.getSubmitterName());
            if (entity.getSubmitterEmail() != null && !entity.getSubmitterEmail().isBlank()) {
                sb.append(" <").append(entity.getSubmitterEmail()).append('>');
            }
            sb.append('\n');
        }
        if (entity.getNotes() != null && !entity.getNotes().isBlank()) {
            sb.append('\n').append(entity.getNotes());
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    private void markSyncPending(FieldListItem entity, String reason) {
        entity.setMaximoSyncPending(Boolean.TRUE);
        try {
            repo.save(entity);
        } catch (RuntimeException persistEx) {
            log.warn("[MaximoFieldList] Failed to persist sync-pending flag for id={} ({}): {}",
                    entity.getId(), reason, persistEx.getMessage());
        }
    }

    private static String defaultIfBlank(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s;
    }

    private static Set<String> parseCsvSet(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptySet();
        Set<String> out = new HashSet<>();
        for (String s : raw.split(",")) {
            String t = s.trim().toLowerCase(Locale.ROOT);
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    /**
     * Parse a comma-separated {@code key:value} map. Trims whitespace, lowercases keys
     * (matches how {@link #shouldRouteToWo} looks up), keeps values verbatim. Skips
     * malformed entries (no colon or empty key/value) with a warning.
     */
    private Map<String, String> parseCsvKvMap(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyMap();
        Map<String, String> out = new HashMap<>();
        for (String pair : raw.split(",")) {
            String[] kv = pair.split(":", 2);
            if (kv.length != 2) {
                log.warn("[MaximoFieldList] Ignoring malformed worktype mapping entry (missing ':'): '{}'", pair);
                continue;
            }
            String k = kv[0].trim().toLowerCase(Locale.ROOT);
            String v = kv[1].trim();
            if (k.isEmpty() || v.isEmpty()) {
                log.warn("[MaximoFieldList] Ignoring worktype mapping entry with empty key or value: '{}'", pair);
                continue;
            }
            out.put(k, v);
        }
        return out;
    }
}
