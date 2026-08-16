package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

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
    private final FieldListItemRepo repo;

    /**
     * FieldListStatus name that triggers a WO COMP on Maximo. Read here (not in the
     * caller) so the caller doesn't need to know about the bridge's conventions.
     */
    @Value("${maximo.field-list.wo-completion-status:Closed}")
    private String woCompletionStatus;

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
        try {
            bridge.submit(entity);
        } catch (RuntimeException e) {
            // Bridge is best-effort but if something escapes, don't let it propagate up.
            log.warn("[MaximoFieldList] onSubmitted id={} failed: {}", event.id(), e.getMessage());
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
}
