package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInsulationItemDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.field_list.FieldListItemMapper;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFieldListBridge;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFieldListEvents;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.FieldListItemSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Insulation-contractor-facing service. Reads active insulation-typed field lists (routed to
 * Maximo as WOs) and lets the contractor close the WO directly when work is done. Distinct
 * from {@link PwaFieldListItemService} which handles the plant-submitter path — contractors
 * NEVER create field lists here, they only work down the active queue.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PwaInsulationService {

    /**
     * FieldListType name that this service is scoped to. Hard-coded rather than config-driven
     * because the "Insulation" role and the "Insulation Removal" type are conceptually paired —
     * changing the type name is a UX rename, not a routing question. Match must be exact for
     * findActiveWoByListType.
     */
    private static final String INSULATION_LIST_TYPE = "Insulation Removal";

    /**
     * Non-terminal WO statuses considered "still needs work". Excludes COMP/CLOSE/CAN so a
     * closed row stops appearing in the contractor's queue immediately after the bridge
     * updates local state.
     */
    private static final List<String> OPEN_WO_STATUSES = List.of("WAPPR", "APPR", "WSCH", "INPRG");

    /** Local FieldListStatus names considered "active" for the WO queue. Symmetric with
     *  OPEN_WO_STATUSES on the Maximo side — the list query OR's both. */
    private static final List<String> LOCAL_OPEN_STATUSES = List.of("Open", "In Progress");

    /** Maximo terminal statuses — what "closed" looks like from the WO side. */
    private static final List<String> TERMINAL_WO_STATUSES = List.of("COMP", "CLOSE", "CAN");

    private final FieldListItemRepo repo;
    private final Optional<MaximoFieldListBridge> maximoBridge;
    private final PermitAttachmentRepo attachmentRepo;
    private final ApplicationEventPublisher events;
    private final FieldListItemSharePointAdapter spAdapter;
    private final NgValueService valueService;
    private final FieldListItemMapper mapper;

    /**
     * Local FieldListStatus name that mirrors a Maximo COMP. Matches
     * {@code maximo.field-list.wo-completion-status} on the bridge side — kept in sync so
     * a Maximo COMP sets local Closed AND a local Closed COMPs Maximo (symmetric).
     */
    @Value("${maximo.field-list.wo-completion-status:Closed}")
    private String localClosedStatusName;

    /** Active insulation WOs across the whole plant, newest-first. Contractors work down this list.
     *  Filter is OR'd on local status vs cached Maximo status — see repo query docs. */
    public List<PwaInsulationItemDto> listActive() {
        return repo.findActiveWoByListType(INSULATION_LIST_TYPE, LOCAL_OPEN_STATUSES, OPEN_WO_STATUSES)
                .stream()
                .map(PwaInsulationService::toDto)
                .toList();
    }

    /**
     * Live-refresh one item's Maximo status from the WO and return the updated DTO. Called
     * when the details dialog opens so we don't trust the up-to-60-s-stale status-poll cache.
     * Symptom that motivated this: ops reopened a WO from COMP → WAPPR in Maximo directly;
     * H2 kept the cached maximoStatus=COMP, the insulation list still filtered the item out,
     * and the drift panel called it "Maximo closed / local open" — all because the cache
     * hadn't yet re-polled.
     *
     * <p>Best-effort: on a Maximo probe failure we return the current cached DTO rather than
     * blocking the dialog — the user can still see everything else, just with a possibly-stale
     * status. bridge.refreshStatus already handles the "no href" case as a no-op.
     */
    public PwaInsulationItemDto refreshMaximoStatus(Long id) {
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) return null;
        try {
            maximoBridge.ifPresent(b -> b.refreshStatus(entity));
        } catch (RuntimeException e) {
            log.warn("[PwaInsulation] refreshMaximoStatus id={} probe failed: {}", id, e.getMessage());
        }
        return toDto(entity);
    }

    /**
     * Recently-closed insulation items — the undo panel behind the "Show recently closed"
     * toggle. Filtered by Maximo terminal status + modified within {@code daysBack} days.
     * Caps to 30 days by default and 90 max so the query stays cheap.
     */
    public List<PwaInsulationItemDto> listRecentClosed(Integer daysBack) {
        int days = daysBack == null || daysBack <= 0 ? 30 : Math.min(daysBack, 90);
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusDays(days);
        return repo.findRecentlyClosedWoByListType(INSULATION_LIST_TYPE, TERMINAL_WO_STATUSES, since)
                .stream()
                .map(PwaInsulationService::toDto)
                .toList();
    }

    /**
     * Contractor marks the item done → COMPs the Maximo WO. Best-effort with a clear boolean
     * result: caller (controller) surfaces "already closed" vs "closed just now" vs "Maximo
     * failed, will retry" as distinct UX states. Returns false only when the row isn't a
     * WO-routed insulation item OR the bridge is absent (feature off) — Maximo API failures
     * are logged inside {@link MaximoFieldListBridge#complete} but surface as false too.
     *
     * Ownership model — SHARED POOL. Any authenticated {@code ROLE_INSULATION} user may close
     * any active insulation WO. This matches the ops workflow: multiple contractors work
     * off the same queue in parallel and pull whichever job is convenient. If per-contractor
     * assignment becomes needed, add an assignment column on FieldListItem + filter in
     * {@link #listActive} + verify {@code submitterHandle} against the assignment here.
     */
    public boolean markComplete(Long id, String submitterHandle) {
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) {
            log.warn("[PwaInsulation] markComplete: id={} not found", id);
            return false;
        }
        if (entity.getListType() == null || !INSULATION_LIST_TYPE.equalsIgnoreCase(entity.getListType().getName())) {
            log.warn("[PwaInsulation] markComplete: id={} is not an insulation item (listType={})",
                    id, entity.getListType() == null ? null : entity.getListType().getName());
            return false;
        }
        if (!MaximoFieldListBridge.REC_TYPE_WO.equals(entity.getMaximoRecordType())) {
            log.warn("[PwaInsulation] markComplete: id={} is not WO-routed (recordType={})",
                    id, entity.getMaximoRecordType());
            return false;
        }
        String memo = "Completed by " + (submitterHandle == null || submitterHandle.isBlank()
                ? "insulation contractor" : submitterHandle);
        String actor = (submitterHandle == null || submitterHandle.isBlank()) ? "insulation contractor" : submitterHandle;
        boolean ok = maximoBridge.map(b -> b.complete(entity, memo)).orElse(false);
        if (ok) syncLocalCloseState(entity, actor);
        return ok;
    }

    /**
     * Enriched close: contractor's comment goes to the Maximo WO worklog + status-change memo;
     * new photos are persisted to H2 (as PermitAttachment rows), pushed to SharePoint (via the
     * SP list-item attachment adapter), and uploaded to the Maximo WO as doclinks (via the
     * AttachmentAdded event → MaximoAttachmentSyncService). Then bridge.complete auto-adds
     * the worklog with the comment (or "Completed" fallback) + sets the Inventory Usage flag
     * + COMPs the WO. Wraps the whole thing in one @Transactional so a mid-flight failure
     * rolls back the H2 additions (SP + Maximo are best-effort each in their own try/catch).
     */
    public boolean markCompleteWithDetails(Long id, String submitterHandle, String comment,
                                           List<PaAttachmentDto> newAttachments) {
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) {
            log.warn("[PwaInsulation] markCompleteWithDetails: id={} not found", id);
            return false;
        }
        if (!isValidInsulationWo(entity, "markCompleteWithDetails", id)) return false;

        String actor = normalizeActor(submitterHandle);
        // Save comment + attachments (adds worklog to Maximo unconditionally when comment
        // is provided so re-complete of an already-COMP WO still records the follow-up note).
        savePartialProgressInternal(entity, actor, comment, newAttachments);

        // COMP the WO. If the save above added a comment-worklog, bridge.complete's
        // ensureWorklogPresent short-circuits (worklog exists) — no duplicate. If no
        // comment was given, ensureWorklogPresent adds "Completed" as fallback. Memo goes
        // on the changeStatus call (capped at 50 chars).
        String memo = (comment != null && !comment.isBlank())
                ? "By " + actor + ": " + comment.trim()
                : "Completed by " + actor;
        boolean ok = maximoBridge.map(b -> b.complete(entity, memo)).orElse(false);
        // Sync local status to Closed + push to SP so all three stores agree.
        if (ok) syncLocalCloseState(entity, actor);
        return ok;
    }

    /**
     * Save contractor progress WITHOUT completing the WO — appends comment to local notes,
     * persists new photos (H2 + SharePoint + Maximo doclinks), and appends the comment to
     * the Maximo WO worklog. No status change, so the item stays in the active queue and
     * the contractor can add more content later. Works on both open and already-completed
     * WOs (Maximo permits worklog + doclink additions on COMP records).
     */
    public boolean savePartialProgress(Long id, String submitterHandle, String comment,
                                       List<PaAttachmentDto> newAttachments) {
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) {
            log.warn("[PwaInsulation] savePartialProgress: id={} not found", id);
            return false;
        }
        if (!isValidInsulationWo(entity, "savePartialProgress", id)) return false;
        String actor = normalizeActor(submitterHandle);
        savePartialProgressInternal(entity, actor, comment, newAttachments);
        return true;
    }

    /**
     * Shared body used by both {@link #markCompleteWithDetails} and {@link #savePartialProgress}:
     *   1. Append comment to entity.notes (local history)
     *   2. Persist each new attachment to H2 (dedup by content-hash), publish AttachmentAdded
     *      (→ Maximo doclink upload), and push to SharePoint if the row has an spId
     *   3. Append comment as a Maximo WO worklog entry (unconditional — bridge.appendWorklog
     *      always writes, unlike bridge.complete's ensureWorklogPresent which skips duplicates).
     */
    private void savePartialProgressInternal(FieldListItem entity, String actor, String comment,
                                             List<PaAttachmentDto> newAttachments) {
        if (comment != null && !comment.isBlank()) {
            String prefix = entity.getNotes() == null || entity.getNotes().isBlank() ? "" : entity.getNotes() + "\n\n";
            entity.setNotes(prefix + "[" + actor + "] " + comment.trim());
            repo.save(entity);
        }
        if (newAttachments != null && !newAttachments.isEmpty()) {
            for (PaAttachmentDto att : newAttachments) {
                if (att == null || att.getBase64Content() == null) continue;
                String hash = sha256(att.getBase64Content());
                if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                        "FieldListItem", entity.getId(), att.getFileName(), hash)) {
                    continue; // dedup
                }
                PermitAttachment saved = new PermitAttachment();
                saved.setEntityType("FieldListItem");
                saved.setEntityId(entity.getId());
                saved.setFileName(att.getFileName());
                saved.setContentType(att.getContentType());
                saved.setBase64Content(att.getBase64Content());
                saved.setAttachmentType(att.getContentType() != null && att.getContentType().startsWith("image/") ? "photo" : "file");
                saved.setContentHash(hash);
                saved = attachmentRepo.save(saved);
                events.publishEvent(new MaximoFieldListEvents.AttachmentAdded(entity.getId(), saved.getId()));
                if (entity.getSharepointId() != null && !entity.getSharepointId().isBlank()) {
                    try {
                        spAdapter.addAttachment(entity.getSharepointId(), att);
                    } catch (Exception e) {
                        log.warn("[PwaInsulation] SP attachment push failed for spId={}: {}",
                                entity.getSharepointId(), e.getMessage());
                    }
                }
            }
        }
        // Append the comment to the Maximo WO worklog UNCONDITIONALLY so:
        //   - Save-progress calls always record the note on Maximo's audit trail
        //   - Re-complete of an already-COMP WO carries the follow-up comment through (the
        //     complete path's bridge.complete would short-circuit and skip the worklog write).
        // No-op when there's no comment, when the row isn't WO-routed, or when the bridge is off.
        if (comment != null && !comment.isBlank()) {
            maximoBridge.ifPresent(b -> b.appendWorklog(entity, "By " + actor + ": " + comment.trim()));
        }
    }

    private boolean isValidInsulationWo(FieldListItem entity, String opName, Long id) {
        if (entity.getListType() == null || !INSULATION_LIST_TYPE.equalsIgnoreCase(entity.getListType().getName())) {
            log.warn("[PwaInsulation] {}: id={} is not an insulation item", opName, id);
            return false;
        }
        if (!MaximoFieldListBridge.REC_TYPE_WO.equals(entity.getMaximoRecordType())) {
            log.warn("[PwaInsulation] {}: id={} is not WO-routed", opName, id);
            return false;
        }
        return true;
    }

    private static String normalizeActor(String submitterHandle) {
        return (submitterHandle == null || submitterHandle.isBlank()) ? "insulation contractor" : submitterHandle;
    }

    /**
     * After a successful Maximo COMP, mirror the close on the local side: set the
     * FieldListStatus to the configured wo-completion-status name (default "Closed"), stamp
     * the contractor-close attribution if not already set, save, and push the full row to
     * SharePoint so its Status column matches. Best-effort SP push in a try/catch — a SP
     * outage doesn't roll back the local status update, but the drift panel will surface any
     * lingering SP divergence for admin cleanup.
     *
     * <p>Side note on event loops: setting local status via repo.save fires the CRDT
     * FieldChange for the status column but NOT the {@code MaximoFieldListEvents.StatusChanged}
     * app-level event (that only fires from the specific service methods that publish it —
     * NgFieldListItemService.changeStatus, FieldListItemSharePointSyncable, etc.). So there's
     * no re-entrancy back into bridge.complete → COMP loop.
     */
    private void syncLocalCloseState(FieldListItem entity, String actor) {
        try {
            entity.setStatus(valueService.createValue("FieldListStatus", localClosedStatusName));
            if (entity.getContractorCompletedBy() == null || entity.getContractorCompletedBy().isBlank()) {
                entity.setContractorCompletedBy(actor);
                entity.setContractorCompletedAt(Instant.now().toString());
            }
            repo.save(entity);
        } catch (RuntimeException e) {
            log.warn("[PwaInsulation] Local status sync failed for id={}: {}", entity.getId(), e.getMessage());
            return;
        }
        // Best-effort SP push — Status column drives the "open items" filter, so leaving it
        // stale is what caused the "closed in Maximo, still Open in H2+SP" symptom. Also
        // explicitly stamp ContractorCompleted=true on the DTO so SP mirrors the boolean
        // the offline-close flow sets (adapter.toMap now forwards those non-null fields).
        if (entity.getSharepointId() != null && !entity.getSharepointId().isBlank()) {
            try {
                FieldListItemDto spDto = mapper.convertToDto(entity);
                spDto.setContractorCompleted(Boolean.TRUE);
                spAdapter.update(entity.getSharepointId(), spDto);
            } catch (Exception e) {
                log.warn("[PwaInsulation] SP status push failed for spId={}: {}",
                        entity.getSharepointId(), e.getMessage());
            }
        }
    }

    /**
     * Reopen a closed insulation item. Restores the local FieldListStatus to "Open", clears
     * the contractor-close attribution, and pushes the change to SharePoint. Does NOT touch
     * the Maximo WO — COMP is terminal via the OSLC API on this tenant (verified: COMP → APPR
     * / INPRG both 400). Ops must manually reopen the Maximo record if the mistake needs to
     * propagate. Returns a message flagging Maximo divergence so the client can surface it.
     */
    public String reopen(Long id) {
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) return "Item not found";
        String currentStatus = entity.getStatus() == null ? null : entity.getStatus().getName();
        if (currentStatus == null || !localClosedStatusName.equalsIgnoreCase(currentStatus)) {
            return "Item is not closed (status: " + currentStatus + ")";
        }
        entity.setStatus(valueService.createValue("FieldListStatus", "Open"));
        entity.setContractorCompletedBy(null);
        entity.setContractorCompletedAt(null);
        repo.save(entity);
        String note = null;
        if (entity.getSharepointId() != null && !entity.getSharepointId().isBlank()) {
            try {
                FieldListItemDto spDto = mapper.convertToDto(entity);
                // Explicitly clear the contractor-close boolean on SP too — the mapper only
                // carries the string markers (which are already null on the entity after our
                // reset above); the boolean needs an explicit false so SP's ContractorCompleted
                // Yes/No column flips back.
                spDto.setContractorCompleted(Boolean.FALSE);
                spAdapter.update(entity.getSharepointId(), spDto);
            } catch (Exception e) {
                note = "Reopened locally; SharePoint push failed and will retry on next SP-sync cycle";
                log.warn("[PwaInsulation] SP reopen push failed for spId={}: {}",
                        entity.getSharepointId(), e.getMessage());
            }
        }
        // Maximo WO stays COMP — the OSLC changeStatus rejects COMP → any-open transition on
        // this tenant. If the item is WO-routed and at terminal status, note it so the client
        // can show a warning banner.
        String maxStatus = entity.getMaximoStatus();
        if (maxStatus != null && ("COMP".equalsIgnoreCase(maxStatus) || "CLOSE".equalsIgnoreCase(maxStatus))) {
            String maxNote = "Maximo WO " + entity.getMaximoRecordId() + " remains " + maxStatus
                    + " — ops must reopen it manually in Maximo if needed";
            note = note == null ? maxNote : note + ". " + maxNote;
        }
        return note; // null = fully successful, non-null = partial success message
    }

    /** List attachments for an insulation item — enforces the listType gate so contractors
     *  can't fish other feature's photos through this endpoint. */
    @Transactional(readOnly = true)
    public List<PermitAttachment> listAttachments(Long id) {
        FieldListItem entity = repo.findById(id).orElse(null);
        if (entity == null) return List.of();
        if (entity.getListType() == null
                || !INSULATION_LIST_TYPE.equalsIgnoreCase(entity.getListType().getName())) {
            return List.of();
        }
        return attachmentRepo.findByEntityTypeAndEntityId("FieldListItem", id);
    }

    private static String sha256(String base64) {
        if (base64 == null) return "";
        try {
            // Canonical content hash = SHA-256 of decoded bytes, matching AttachmentSyncHandler
            // + PermitAttachmentSyncService + NgFieldListItemService. Previously hashed the
            // base64 STRING which produced a different value than SP-import computed for the
            // same file, so the SP round-trip couldn't dedup and created a duplicate
            // PermitAttachment row (visible in the insulation dialog's photo grid).
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest(java.util.Base64.getDecoder().decode(base64));
            StringBuilder sb = new StringBuilder(h.length * 2);
            for (byte b : h) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private static PwaInsulationItemDto toDto(FieldListItem e) {
        PwaInsulationItemDto d = new PwaInsulationItemDto();
        d.setId(e.getId());
        d.setTitle(e.getTitle());
        d.setNotes(e.getNotes());
        d.setSpecificLocation(e.getSpecificLocation());
        d.setLocationName(e.getLocation() == null ? null : e.getLocation().getName());
        d.setEquipmentTag(e.getEquipment() == null ? null : e.getEquipment().getTagNumber());
        d.setSubmitterName(e.getSubmitterName());
        d.setDateObserved(e.getDateObserved());
        d.setTimeObserved(e.getTimeObserved());
        d.setMaximoWonum(e.getMaximoRecordId());
        d.setMaximoStatus(e.getMaximoStatus());
        return d;
    }
}
