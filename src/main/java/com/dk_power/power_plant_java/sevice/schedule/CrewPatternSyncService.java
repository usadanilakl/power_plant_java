package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.CrewPattern;
import com.dk_power.power_plant_java.repository.schedule.CrewPatternRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link CrewPattern}. Registered in {@code ServiceFacade} so inbound
 * field-changes apply (without it, {@code FieldSyncService} drops the batch with "No service found"
 * and {@code SyncRegistryValidator} reports the type as degraded). Thin pass-through over the repo;
 * business logic lives in {@code NgScheduleV2Service}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CrewPatternSyncService implements SyncableService<CrewPattern> {

    private final CrewPatternRepo repo;

    @Override public CrewPattern getEntity() { return new CrewPattern(); }
    @Override public CrewPattern getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<CrewPattern> getAll() { return repo.findAll(); }
    @Override public CrewPattern save(CrewPattern entity) { return repo.save(entity); }
    @Override public CrewPattern saveAndFlush(CrewPattern entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<CrewPattern> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(CrewPattern item) { repo.save(item); }
    @Override public void processSyncItems(List<CrewPattern> items) { repo.saveAll(items); }

    @Override
    public Page<CrewPattern> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<CrewPattern> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
