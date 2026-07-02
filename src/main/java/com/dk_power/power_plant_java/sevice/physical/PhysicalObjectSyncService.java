package com.dk_power.power_plant_java.sevice.physical;

import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link PhysicalObject} so the inbound CRDT apply pass can materialize hierarchy nodes on
 * every device. Without a ServiceFacade entry, {@code FieldSyncService.applyEntityChangesBatched} gets a null
 * service and silently drops every change ("No service found for entity type"). Thin pass-through over the repo,
 * modeled on {@code RecurringPmSyncService}; soft-delete (setDeleted + save) preserves prune propagation.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class PhysicalObjectSyncService implements SyncableService<PhysicalObject> {

    private final PhysicalObjectRepo repo;

    @Override public PhysicalObject getEntity() { return new PhysicalObject(); }
    @Override public PhysicalObject getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<PhysicalObject> getAll() { return repo.findAll(); }
    @Override public PhysicalObject save(PhysicalObject entity) { return repo.save(entity); }
    @Override public PhysicalObject saveAndFlush(PhysicalObject entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<PhysicalObject> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(PhysicalObject item) { repo.save(item); }
    @Override public void processSyncItems(List<PhysicalObject> items) { repo.saveAll(items); }

    @Override
    public Page<PhysicalObject> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<PhysicalObject> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
