package com.dk_power.power_plant_java.sevice.angular.inventory;

import com.dk_power.power_plant_java.entities.inventory.InventoryUsage;
import com.dk_power.power_plant_java.repository.inventory.InventoryUsageRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class InventoryUsageSyncService implements SyncableService<InventoryUsage> {

    private final InventoryUsageRepo repo;

    @Override public InventoryUsage getEntity() { return new InventoryUsage(); }
    @Override public InventoryUsage getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<InventoryUsage> getAll() { return repo.findAll(); }
    @Override public InventoryUsage save(InventoryUsage entity) { return repo.save(entity); }
    @Override public InventoryUsage saveAndFlush(InventoryUsage entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<InventoryUsage> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(InventoryUsage item) { repo.save(item); }
    @Override public void processSyncItems(List<InventoryUsage> items) { repo.saveAll(items); }

    @Override
    public Page<InventoryUsage> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<InventoryUsage> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
