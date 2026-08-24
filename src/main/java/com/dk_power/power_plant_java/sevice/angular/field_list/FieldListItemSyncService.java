package com.dk_power.power_plant_java.sevice.angular.field_list;

import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFieldListEvents;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class FieldListItemSyncService implements SyncableService<FieldListItem> {

    private final FieldListItemRepo repo;
    /**
     * Publishes Maximo bridge events for rows that arrive via CRDT sync-apply. Without this,
     * a row created on a desktop while the hub was offline would never reach Maximo when it
     * eventually syncs to the hub — the user-facing service methods (NgFieldListItemService.save,
     * PwaFieldListItemService.submitFieldListItem) publish events on direct writes, but the
     * sync-apply path bypasses them.
     *
     * Bridge is hub-only and idempotent (early-returns if maximoRecordId is already set), so
     * publishing here on desktops is a no-op and duplicate publishes on the hub are harmless.
     */
    private final ApplicationEventPublisher events;

    @Override
    public FieldListItem getEntity() { return new FieldListItem(); }

    @Override
    public FieldListItem getEntityById(Long id) { return repo.findById(id).orElse(null); }

    @Override
    public List<FieldListItem> getAll() { return repo.findAll(); }

    @Override
    public FieldListItem save(FieldListItem entity) {
        FieldListItem saved = repo.save(entity);
        maybePublishMaximoEvent(saved);
        return saved;
    }

    @Override
    public FieldListItem saveAndFlush(FieldListItem entity) {
        FieldListItem saved = repo.saveAndFlush(entity);
        maybePublishMaximoEvent(saved);
        return saved;
    }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
            maybePublishMaximoEvent(entity);
        });
    }

    @Override
    public List<FieldListItem> getAllSince(LocalDateTime since) {
        return repo.findAllByDateModifiedAfter(since);
    }

    @Override
    public void processSyncItem(FieldListItem item) {
        FieldListItem saved = repo.save(item);
        maybePublishMaximoEvent(saved);
    }

    @Override
    public void processSyncItems(List<FieldListItem> items) {
        List<FieldListItem> savedList = repo.saveAll(items);
        for (FieldListItem s : savedList) maybePublishMaximoEvent(s);
    }

    @Override
    public Page<FieldListItem> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<FieldListItem> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }

    /**
     * Decide which Maximo event (if any) to fire for a just-saved row. Runs on both the hub and
     * desktops — on desktops the bridge bean is absent so the AFTER_COMMIT listener has no
     * subscriber and the event is a no-op. On the hub, the bridge's own idempotency checks
     * prevent duplicate work if the event was ALSO fired by the direct-service path.
     *
     * Three cases:
     *   1. Row is soft-deleted AND has a Maximo record → Cancelled (cancel the Maximo record)
     *   2. Row is live AND has no Maximo record → Submitted (route to Maximo for the first time)
     *   3. Row is live AND WO-routed AND Maximo not terminal → StatusChanged (listener filters
     *      by wo-completion-status; bridge.complete is idempotent on terminal state so a
     *      spurious publish is a cheap no-op — needed because a status-to-Closed reaching the
     *      hub only via CRDT sync would otherwise never COMP the WO).
     */
    private void maybePublishMaximoEvent(FieldListItem saved) {
        if (saved == null || saved.getId() == null) return;
        boolean deleted = Boolean.TRUE.equals(saved.getDeleted());
        String href = saved.getMaximoHref();
        String recId = saved.getMaximoRecordId();
        if (deleted && href != null && !href.isBlank()) {
            events.publishEvent(new MaximoFieldListEvents.Cancelled(saved.getId(),
                    "Sync-applied soft-delete"));
            return;
        }
        if (!deleted && (recId == null || recId.isBlank())) {
            // Guard: never route a locally-terminal row to Maximo. A Closed / Cancelled
            // field-list has no work to log — pushing it creates a WAPPR WO that ops has to
            // clean up. This bit us when enabling the bridge on a repo that already had
            // Closed-in-SP items with no maximoRecordId: the next SP-import / CRDT save
            // fired Submitted → bridge created WOs for every old April item.
            // See comment on isLocallyTerminal for status-name convention.
            if (isLocallyTerminal(saved.getStatus() == null ? null : saved.getStatus().getName())) {
                return;
            }
            events.publishEvent(new MaximoFieldListEvents.Submitted(saved.getId()));
            return;
        }
        // Already-routed live row: check whether local status warrants a WO COMP. Publishing
        // covers the sync-arrived-status-flip case (desktop closes, syncs to hub, hub must
        // COMP the WO). Filter on WO recordType + non-terminal Maximo status so we don't
        // spam events for SR-routed rows or already-completed WOs.
        if (!deleted
                && "WO".equals(saved.getMaximoRecordType())
                && saved.getStatus() != null && saved.getStatus().getName() != null
                && !isMaximoTerminal(saved.getMaximoStatus())) {
            events.publishEvent(new MaximoFieldListEvents.StatusChanged(
                    saved.getId(), saved.getStatus().getName(), "sync-apply"));
        }
    }

    private static boolean isMaximoTerminal(String status) {
        if (status == null) return false;
        return "COMP".equalsIgnoreCase(status)
                || "CLOSE".equalsIgnoreCase(status)
                || "CAN".equalsIgnoreCase(status);
    }

    /**
     * Local FieldListStatus names that mean "no work to do" from the plant's perspective.
     * Kept as a small hard-coded set — the local Value list is stable and the mapping to the
     * Maximo bridge's {@code wo-completion-status} setting doesn't need to be config-driven
     * here (this check is a filter, not authoritative status logic).
     */
    public static boolean isLocallyTerminal(String name) {
        if (name == null || name.isBlank()) return false;
        return "Closed".equalsIgnoreCase(name) || "Cancelled".equalsIgnoreCase(name);
    }
}
