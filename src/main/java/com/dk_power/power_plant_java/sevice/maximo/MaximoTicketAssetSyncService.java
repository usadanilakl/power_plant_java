package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.entities.maximo.MaximoTicketAsset;
import com.dk_power.power_plant_java.repository.maximo.MaximoTicketAssetRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link MaximoTicketAsset} so the hub-built ticket→asset index materializes on every
 * desktop via the inbound CRDT apply pass. Without a ServiceFacade entry, {@code FieldSyncService} would log
 * "No service found for entity type: MaximoTicketAsset" and silently drop every change. Thin repo wrapper,
 * modeled on {@code RecurringPmSyncService}; soft-delete preserves prune propagation.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class MaximoTicketAssetSyncService implements SyncableService<MaximoTicketAsset> {

    private final MaximoTicketAssetRepo repo;

    @Override public MaximoTicketAsset getEntity() { return new MaximoTicketAsset(); }
    @Override public MaximoTicketAsset getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<MaximoTicketAsset> getAll() { return repo.findAll(); }
    @Override public MaximoTicketAsset save(MaximoTicketAsset entity) { return repo.save(entity); }
    @Override public MaximoTicketAsset saveAndFlush(MaximoTicketAsset entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<MaximoTicketAsset> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(MaximoTicketAsset item) { repo.save(item); }
    @Override public void processSyncItems(List<MaximoTicketAsset> items) { repo.saveAll(items); }

    @Override
    public Page<MaximoTicketAsset> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<MaximoTicketAsset> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
