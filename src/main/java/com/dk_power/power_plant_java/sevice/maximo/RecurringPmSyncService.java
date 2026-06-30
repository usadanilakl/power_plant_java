package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import com.dk_power.power_plant_java.repository.maximo.RecurringPmRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link RecurringPm} so the inbound CRDT apply pass can materialize catalog rows on
 * other devices. Without a ServiceFacade entry, {@code FieldSyncService.applyEntityChangesBatched} gets a
 * null service and silently drops every RecurringPm change ("No service found for entity type") — so the
 * lead-scan catalog built on one desktop never appeared elsewhere. Thin pass-through over the repo, modeled
 * on {@code InventoryItemSyncService}; soft-delete (setDeleted + save) preserves prune propagation.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class RecurringPmSyncService implements SyncableService<RecurringPm> {

    private final RecurringPmRepo repo;

    @Override public RecurringPm getEntity() { return new RecurringPm(); }
    @Override public RecurringPm getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<RecurringPm> getAll() { return repo.findAll(); }
    @Override public RecurringPm save(RecurringPm entity) { return repo.save(entity); }
    @Override public RecurringPm saveAndFlush(RecurringPm entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<RecurringPm> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(RecurringPm item) { repo.save(item); }
    @Override public void processSyncItems(List<RecurringPm> items) { repo.saveAll(items); }

    @Override
    public Page<RecurringPm> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<RecurringPm> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
