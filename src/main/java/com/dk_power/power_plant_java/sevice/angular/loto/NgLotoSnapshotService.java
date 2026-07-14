package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.entities.loto.LotoSnapshot;
import com.dk_power.power_plant_java.repository.loto.LotoSnapshotRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link LotoSnapshot} — the per-Loto lifecycle-event
 * capture (hang marks, verify marks, transfer, accept, release, walkdown
 * personnel, lotoPointsData). Exists ONLY so that
 * {@link com.dk_power.power_plant_java.sevice.ServiceFacade#getService(String)}
 * returns a non-null service for entity type {@code "LotoSnapshot"}. Without
 * this, FieldChange rows for LotoSnapshot emit from the source client and
 * reach the hub's {@code field_change} table, but the desktop applier in
 * {@link com.dk_power.power_plant_java.sevice.sync.FieldSyncService#applyEntityChangesBatched}
 * short-circuits at {@code getService()==null}, silently drops the batch,
 * yet still ACKs the hub — so lifecycle events never propagate to peers.
 * <p>
 * All lifecycle mutations continue to live on {@code NgLotoService}. Thin
 * pass-through over the repo — modeled on {@code PhysicalObjectSyncService}.
 * Soft-delete (setDeleted + save) preserves prune propagation.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NgLotoSnapshotService implements SyncableService<LotoSnapshot> {

    private final LotoSnapshotRepo repo;

    @Override public LotoSnapshot getEntity() { return new LotoSnapshot(); }
    @Override public LotoSnapshot getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<LotoSnapshot> getAll() { return repo.findAll(); }
    @Override public LotoSnapshot save(LotoSnapshot entity) { return repo.save(entity); }
    @Override public LotoSnapshot saveAndFlush(LotoSnapshot entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<LotoSnapshot> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(LotoSnapshot item) { repo.save(item); }
    @Override public void processSyncItems(List<LotoSnapshot> items) { repo.saveAll(items); }

    @Override
    public Page<LotoSnapshot> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<LotoSnapshot> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
