package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.entities.loto.LotoStandardApprovalEvent;
import com.dk_power.power_plant_java.repository.loto.LotoStandardApprovalEventRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link LotoStandardApprovalEvent} — the immutable
 * audit rows written on every LotoStandard lifecycle transition
 * (Draft → Verification → Approved, revisions, etc.).
 * <p>
 * Without this registration the transition never propagates: the event row is
 * written on the source node and emits a FieldChange, but the applier calls
 * {@code serviceFacade.getService("LotoStandardApprovalEvent")}, gets null,
 * logs "No service found for entity type", and drops the WHOLE batch
 * ({@code peer_sync.batch.complete applied=0}). The observed symptom was a
 * client flipping a standard Draft → Verification and the hub never receiving
 * it. Same silent-drop bug class already fixed for
 * {@link NgLotoStandardPendingChangeService} and {@code LotoSnapshot}.
 * <p>
 * Thin pass-through over the repo; all approval/transition business logic lives
 * on {@code NgLotoStandardService}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NgLotoStandardApprovalEventService implements SyncableService<LotoStandardApprovalEvent> {

    private final LotoStandardApprovalEventRepo repo;

    @Override public LotoStandardApprovalEvent getEntity() { return new LotoStandardApprovalEvent(); }
    @Override public LotoStandardApprovalEvent getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<LotoStandardApprovalEvent> getAll() { return repo.findAll(); }
    @Override public LotoStandardApprovalEvent save(LotoStandardApprovalEvent entity) { return repo.save(entity); }
    @Override public LotoStandardApprovalEvent saveAndFlush(LotoStandardApprovalEvent entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<LotoStandardApprovalEvent> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(LotoStandardApprovalEvent item) { repo.save(item); }
    @Override public void processSyncItems(List<LotoStandardApprovalEvent> items) { repo.saveAll(items); }

    @Override
    public Page<LotoStandardApprovalEvent> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<LotoStandardApprovalEvent> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
