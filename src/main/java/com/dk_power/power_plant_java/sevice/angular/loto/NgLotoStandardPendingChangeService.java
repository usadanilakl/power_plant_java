package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.entities.loto.LotoStandardPendingChange;
import com.dk_power.power_plant_java.repository.loto.LotoStandardPendingChangeRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link LotoStandardPendingChange} — the per-field
 * pending-review rows written when someone edits an APPROVED LotoStandard.
 * Without this registration, prerequisite edits (and any other content edit
 * that hits the review workflow) never propagate to peer clients: the row is
 * written on the source node, emits a FieldChange, but the applier can't
 * find a service for the entity type and drops the batch silently. Result:
 * peers never see "pending review" state.
 * <p>
 * Thin pass-through over the repo, modeled on {@code PhysicalObjectSyncService}.
 * Coalesce / resolve / close-review logic stays on {@code NgLotoStandardService}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NgLotoStandardPendingChangeService implements SyncableService<LotoStandardPendingChange> {

    private final LotoStandardPendingChangeRepo repo;

    @Override public LotoStandardPendingChange getEntity() { return new LotoStandardPendingChange(); }
    @Override public LotoStandardPendingChange getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<LotoStandardPendingChange> getAll() { return repo.findAll(); }
    @Override public LotoStandardPendingChange save(LotoStandardPendingChange entity) { return repo.save(entity); }
    @Override public LotoStandardPendingChange saveAndFlush(LotoStandardPendingChange entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<LotoStandardPendingChange> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(LotoStandardPendingChange item) { repo.save(item); }
    @Override public void processSyncItems(List<LotoStandardPendingChange> items) { repo.saveAll(items); }

    @Override
    public Page<LotoStandardPendingChange> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<LotoStandardPendingChange> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
