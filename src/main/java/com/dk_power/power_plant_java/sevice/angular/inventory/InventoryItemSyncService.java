package com.dk_power.power_plant_java.sevice.angular.inventory;

import com.dk_power.power_plant_java.entities.inventory.InventoryItem;
import com.dk_power.power_plant_java.repository.inventory.InventoryItemRepo;
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
public class InventoryItemSyncService implements SyncableService<InventoryItem> {

    private final InventoryItemRepo repo;

    @Override public InventoryItem getEntity() { return new InventoryItem(); }
    @Override public InventoryItem getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<InventoryItem> getAll() { return repo.findAll(); }
    @Override public InventoryItem save(InventoryItem entity) { return repo.save(entity); }
    @Override public InventoryItem saveAndFlush(InventoryItem entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<InventoryItem> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(InventoryItem item) { repo.save(item); }
    @Override public void processSyncItems(List<InventoryItem> items) { repo.saveAll(items); }

    @Override
    public Page<InventoryItem> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<InventoryItem> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
