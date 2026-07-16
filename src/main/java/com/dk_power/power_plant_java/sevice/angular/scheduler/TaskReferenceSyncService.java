package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.entities.scheduler.TaskReference;
import com.dk_power.power_plant_java.repository.scheduler.TaskReferenceRepository;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link TaskReference} — scheduler task references. Registered so its changes
 * propagate across devices (schedule is 100% synced). Thin pass-through over the repo.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class TaskReferenceSyncService implements SyncableService<TaskReference> {

    private final TaskReferenceRepository repo;

    @Override public TaskReference getEntity() { return new TaskReference(); }
    @Override public TaskReference getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<TaskReference> getAll() { return repo.findAll(); }
    @Override public TaskReference save(TaskReference entity) { return repo.save(entity); }
    @Override public TaskReference saveAndFlush(TaskReference entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<TaskReference> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(TaskReference item) { repo.save(item); }
    @Override public void processSyncItems(List<TaskReference> items) { repo.saveAll(items); }

    @Override
    public Page<TaskReference> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<TaskReference> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
