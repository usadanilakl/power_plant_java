package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.WorkCategoryProfile;
import com.dk_power.power_plant_java.repository.permits.WorkCategoryProfileRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link WorkCategoryProfile}. It is listed in
 * {@code EntityTableRegistry} (table map + SYNC_ORDER) but had no service in
 * {@code ServiceFacade}, so inbound changes hit "No service found for entity type"
 * and the whole batch was dropped — the same silent-drop bug fixed for
 * {@code LotoStandardApprovalEvent}. Thin pass-through over the repo; hazard-profile
 * business logic stays on {@code NgWorkCategoryProfileService}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class WorkCategoryProfileSyncService implements SyncableService<WorkCategoryProfile> {

    private final WorkCategoryProfileRepo repo;

    @Override public WorkCategoryProfile getEntity() { return new WorkCategoryProfile(); }
    @Override public WorkCategoryProfile getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<WorkCategoryProfile> getAll() { return repo.findAll(); }
    @Override public WorkCategoryProfile save(WorkCategoryProfile entity) { return repo.save(entity); }
    @Override public WorkCategoryProfile saveAndFlush(WorkCategoryProfile entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<WorkCategoryProfile> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(WorkCategoryProfile item) { repo.save(item); }
    @Override public void processSyncItems(List<WorkCategoryProfile> items) { repo.saveAll(items); }

    @Override
    public Page<WorkCategoryProfile> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<WorkCategoryProfile> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
