package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Optional;

/**
 * Runs Maximo bridge operations AFTER the caller's transaction commits. See
 * {@link MaximoFieldListEvents} for the rationale (avoids the REQUIRES_NEW-can't-see-uncommitted
 * bug that codex flagged).
 *
 * Each handler:
 *   1. Runs in a FRESH transaction (not tied to the caller's; the caller has already committed)
 *   2. Re-fetches by id so we operate on a managed instance, not the pre-commit reference
 *   3. Cancel handler uses the deleted-inclusive lookup because the row is soft-deleted
 *
 * Same activation gate as the bridge — hub-only, feature-flagged.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnExpression(
        "'${maximo.api-key:}'.length() > 0 "
        + "and '${maximo.field-list.enabled:false}' == 'true' "
        + "and '${sync.role:}' == 'hub'")
public class MaximoFieldListEventListener {

    private final MaximoFieldListBridge bridge;
    private final MaximoAttachmentSyncService attachmentSync;
    private final FieldListItemRepo repo;
    private final PermitAttachmentRepo attachmentRepo;
    /**
     * For re-publishing AttachmentAdded events after a Submitted event routes the parent row
     * to Maximo. Any attachments that were saved BEFORE the row had a maximoHref get their
     * upload retriggered here, so the whole PWA-submit-with-attachments-in-one-call flow
     * doesn't need to coordinate attachment upload with the parent's route completion.
     */
    private final ApplicationEventPublisher events;

    /**
     * FieldListStatus name that triggers a WO COMP on Maximo. Read here (not in the
     * caller) so the caller doesn't need to know about the bridge's conventions.
     */
    @Value("${maximo.field-list.wo-completion-status:Closed}")
    private String woCompletionStatus;

    /**
     * Comma-separated FieldListType names whose ContractorCompleted signal is allowed to
     * COMP the Maximo WO. Only Insulation Removal today (only contractor-facing type on
     * this tenant), but explicit config so adding new WO-routed types (e.g. Painting)
     * doesn't accidentally grant contractor-close authority to them. A crafted PA update
     * setting ContractorCompleted=true on a non-listed type is a no-op here.
     * Case-insensitive match against {@code listType.name}. Blank = deny all.
     */
    @Value("${maximo.field-list.contractor-completable-types:Insulation Removal}")
    private String contractorCompletableTypesRaw;

    private java.util.Set<String> contractorCompletableTypes = java.util.Collections.emptySet();

    @jakarta.annotation.PostConstruct
    void parseContractorTypes() {
        java.util.Set<String> out = new java.util.HashSet<>();
        if (contractorCompletableTypesRaw != null) {
            for (String s : contractorCompletableTypesRaw.split(",")) {
                String t = s.trim().toLowerCase(java.util.Locale.ROOT);
                if (!t.isEmpty()) out.add(t);
            }
        }
        this.contractorCompletableTypes = out;
        log.info("[MaximoFieldList] Contractor-completable types: {}", contractorCompletableTypes);
    }

    // fallbackExecution=true so an event published outside any tx (self-invocation
    // bypassing the class-level proxy, or a future non-@Transactional caller) still
    // runs — silent drop would be a subtle sync gap. REQUIRES_NEW ensures we get a
    // truly fresh tx rather than participating in the caller's already-completed
    // tx-scoped EntityManager (AFTER_COMMIT can still see suspended bindings).
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSubmitted(MaximoFieldListEvents.Submitted event) {
        if (event == null || event.id() == null) return;
        log.info("[MaximoFieldList] EVENT onSubmitted id={} — event listener fired (after-commit)", event.id());
        FieldListItem entity = repo.findById(event.id()).orElse(null);
        if (entity == null) {
            log.warn("[MaximoFieldList] Submitted event for id={} but row not found", event.id());
            return;
        }
        boolean routed;
        try {
            routed = bridge.submit(entity);
        } catch (RuntimeException e) {
            // Bridge is best-effort but if something escapes, don't let it propagate up.
            log.warn("[MaximoFieldList] onSubmitted id={} failed: {}", event.id(), e.getMessage());
            routed = false;
        }
        // If the row is now routed (has a maximoHref), re-publish AttachmentAdded for any
        // attachments that were saved BEFORE the row reached Maximo. Common case: PWA submit
        // where the row + attachments were saved in the same transaction — the attachments'
        // Submitted events (if any were published inline) may have run before the row's
        // Submitted did. Re-firing here catches them up. maximoDoclinkId idempotency ensures
        // no double-upload.
        if (routed && entity.getMaximoHref() != null && !entity.getMaximoHref().isBlank()) {
            List<PermitAttachment> atts = attachmentRepo.findByEntityTypeAndEntityId("FieldListItem", event.id());
            for (PermitAttachment a : atts) {
                if (a.getMaximoDoclinkId() == null || a.getMaximoDoclinkId().isBlank()) {
                    events.publishEvent(new MaximoFieldListEvents.AttachmentAdded(event.id(), a.getId()));
                }
            }
        }
    }

    // fallbackExecution=true so an event published outside any tx (self-invocation
    // bypassing the class-level proxy, or a future non-@Transactional caller) still
    // runs — silent drop would be a subtle sync gap. REQUIRES_NEW ensures we get a
    // truly fresh tx rather than participating in the caller's already-completed
    // tx-scoped EntityManager (AFTER_COMMIT can still see suspended bindings).
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onCancelled(MaximoFieldListEvents.Cancelled event) {
        if (event == null || event.id() == null) return;
        log.info("[MaximoFieldList] EVENT onCancelled id={} reason={} — event listener fired", event.id(), event.reason());
        // Cancel path targets soft-deleted rows, which the standard findById filters via
        // @Where(deleted != true). Use the deleted-inclusive native lookup instead.
        Optional<FieldListItem> found = repo.findByIdIncludingDeleted(event.id());
        if (found.isEmpty()) {
            log.warn("[MaximoFieldList] Cancelled event for id={} but row not found", event.id());
            return;
        }
        FieldListItem entity = found.get();
        if (entity.getMaximoHref() == null || entity.getMaximoHref().isBlank()) {
            // Never made it to Maximo — nothing to cancel. Clear a stale flag if set.
            if (Boolean.TRUE.equals(entity.getMaximoCancelPending())) {
                entity.setMaximoCancelPending(Boolean.FALSE);
                try { repo.save(entity); } catch (RuntimeException ignore) { /* backfill re-checks */ }
            }
            return;
        }
        try {
            bridge.cancel(entity, event.reason());
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] onCancelled id={} failed: {}", event.id(), e.getMessage());
        }
    }

    // fallbackExecution=true so an event published outside any tx (self-invocation
    // bypassing the class-level proxy, or a future non-@Transactional caller) still
    // runs — silent drop would be a subtle sync gap. REQUIRES_NEW ensures we get a
    // truly fresh tx rather than participating in the caller's already-completed
    // tx-scoped EntityManager (AFTER_COMMIT can still see suspended bindings).
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStatusChanged(MaximoFieldListEvents.StatusChanged event) {
        if (event == null || event.id() == null || event.newStatusName() == null) return;
        log.info("[MaximoFieldList] EVENT onStatusChanged id={} newStatus={} actor={} — event listener fired",
                event.id(), event.newStatusName(), event.actor());
        if (woCompletionStatus == null || woCompletionStatus.isBlank()) return;
        if (!woCompletionStatus.equalsIgnoreCase(event.newStatusName())) return;
        // PESSIMISTIC_WRITE lock — pairs with the same lock the status poll reconcile
        // takes on findAndLockByMaximoRecord. Both writers serialize per row so neither
        // can clobber the other's just-committed maximoStatus.
        FieldListItem entity = repo.findAndLockById(event.id()).orElse(null);
        if (entity == null) {
            log.warn("[MaximoFieldList] StatusChanged event for id={} but row not found", event.id());
            return;
        }
        String actor = event.actor() == null || event.actor().isBlank() ? "user" : event.actor();
        try {
            bridge.complete(entity, "Closed via " + event.newStatusName() + " by " + actor);
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] onStatusChanged id={} failed: {}", event.id(), e.getMessage());
        }
    }

    /**
     * The contractor closed the field-list item OFFLINE via PWA→PA→SharePoint (hub was
     * unreachable at close time). SP-import polling detected the ContractorCompleted
     * transition. This handler COMPs the Maximo WO — same code path as the online
     * StatusChanged→Closed flow, so idempotency guards prevent double-COMP if the local
     * status also flipped to Closed via a separate path.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onContractorClosed(MaximoFieldListEvents.ContractorClosed event) {
        if (event == null || event.fieldListItemId() == null) return;
        log.info("[MaximoFieldList] EVENT onContractorClosed id={} actor={} — event listener fired",
                event.fieldListItemId(), event.actor());
        FieldListItem entity = repo.findAndLockById(event.fieldListItemId()).orElse(null);
        if (entity == null) {
            log.warn("[MaximoFieldList] ContractorClosed event for id={} but row not found",
                    event.fieldListItemId());
            return;
        }
        // Guard: contractor close is only valid for types explicitly opted in. Otherwise a
        // crafted PWA→PA payload setting ContractorCompleted=true on any WO-routed row
        // could COMP arbitrary WOs plant-wide. Today only Insulation Removal is a contractor
        // workflow; if that ever grows, add the new type to contractor-completable-types.
        String typeName = entity.getListType() == null ? null : entity.getListType().getName();
        if (typeName == null
                || !contractorCompletableTypes.contains(typeName.toLowerCase(java.util.Locale.ROOT))) {
            log.warn("[MaximoFieldList] ContractorClosed id={} rejected — listType='{}' not in {}",
                    event.fieldListItemId(), typeName, contractorCompletableTypes);
            return;
        }
        String actor = event.actor() == null || event.actor().isBlank() ? "contractor" : event.actor();
        try {
            bridge.complete(entity, "Closed via SP by " + actor);
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] onContractorClosed id={} failed: {}",
                    event.fieldListItemId(), e.getMessage());
        }
    }

    /**
     * A field-list item's descriptive fields changed (PWA edit or hub edit). Push the new
     * values down to the Maximo record so title/notes/location/asset edits propagate all the
     * way. Best-effort — a Maximo outage doesn't block the H2 save; the drift panel will
     * surface any lingering divergence.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUpdated(MaximoFieldListEvents.Updated event) {
        if (event == null || event.id() == null) return;
        log.info("[MaximoFieldList] EVENT onUpdated id={} actor={} — event listener fired",
                event.id(), event.actor());
        FieldListItem entity = repo.findById(event.id()).orElse(null);
        if (entity == null) {
            log.warn("[MaximoFieldList] Updated event for id={} but row not found", event.id());
            return;
        }
        // No maximoHref → row wasn't routed to Maximo (SR/WO not created yet, or feature
        // was off when the row was first submitted). Nothing to update; the bridge.updateFields
        // early-returns on this case with no side effects.
        if (entity.getMaximoHref() == null || entity.getMaximoHref().isBlank()) return;
        try {
            bridge.updateFields(entity);
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] onUpdated id={} failed: {}", event.id(), e.getMessage());
        }
    }

    /**
     * A PermitAttachment was saved on a FieldListItem — upload it to the parent Maximo
     * record. See {@link MaximoAttachmentSyncService} for the upload/pending/retry logic.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAttachmentAdded(MaximoFieldListEvents.AttachmentAdded event) {
        if (event == null || event.attachmentId() == null) return;
        log.info("[MaximoFieldList] EVENT onAttachmentAdded fieldListItemId={} attachmentId={}",
                event.fieldListItemId(), event.attachmentId());
        try {
            attachmentSync.uploadOne(event.attachmentId());
        } catch (RuntimeException e) {
            log.warn("[MaximoFieldList] onAttachmentAdded attId={} failed: {}",
                    event.attachmentId(), e.getMessage());
        }
    }
}
