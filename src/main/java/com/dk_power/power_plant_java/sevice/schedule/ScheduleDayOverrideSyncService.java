package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.ScheduleDayOverride;
import com.dk_power.power_plant_java.repository.schedule.ScheduleDayOverrideRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link ScheduleDayOverride} — see {@link CrewPatternSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class ScheduleDayOverrideSyncService implements SyncableService<ScheduleDayOverride> {

    private final ScheduleDayOverrideRepo repo;

    @Override public ScheduleDayOverride getEntity() { return new ScheduleDayOverride(); }
    @Override public ScheduleDayOverride getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<ScheduleDayOverride> getAll() { return repo.findAll(); }
    @Override public ScheduleDayOverride save(ScheduleDayOverride entity) { return repo.save(entity); }
    @Override public ScheduleDayOverride saveAndFlush(ScheduleDayOverride entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<ScheduleDayOverride> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(ScheduleDayOverride item) { repo.save(item); }
    @Override public void processSyncItems(List<ScheduleDayOverride> items) { repo.saveAll(items); }

    @Override
    public Page<ScheduleDayOverride> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<ScheduleDayOverride> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
