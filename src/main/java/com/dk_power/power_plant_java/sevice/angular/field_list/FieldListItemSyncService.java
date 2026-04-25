package com.dk_power.power_plant_java.sevice.angular.field_list;

import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
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
public class FieldListItemSyncService implements SyncableService<FieldListItem> {

    private final FieldListItemRepo repo;

    @Override
    public FieldListItem getEntity() { return new FieldListItem(); }

    @Override
    public FieldListItem getEntityById(Long id) { return repo.findById(id).orElse(null); }

    @Override
    public List<FieldListItem> getAll() { return repo.findAll(); }

    @Override
    public FieldListItem save(FieldListItem entity) { return repo.save(entity); }

    @Override
    public FieldListItem saveAndFlush(FieldListItem entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override
    public List<FieldListItem> getAllSince(LocalDateTime since) {
        return repo.findAllByDateModifiedAfter(since);
    }

    @Override
    public void processSyncItem(FieldListItem item) { repo.save(item); }

    @Override
    public void processSyncItems(List<FieldListItem> items) { repo.saveAll(items); }

    @Override
    public Page<FieldListItem> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<FieldListItem> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
