package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.CrewShiftOverride;
import com.dk_power.power_plant_java.repository.schedule.CrewShiftOverrideRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link CrewShiftOverride} — see {@link CrewSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class CrewShiftOverrideSyncService implements SyncableService<CrewShiftOverride> {

    private final CrewShiftOverrideRepo repo;

    @Override public CrewShiftOverride getEntity() { return new CrewShiftOverride(); }
    @Override public CrewShiftOverride getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<CrewShiftOverride> getAll() { return repo.findAll(); }
    @Override public CrewShiftOverride save(CrewShiftOverride entity) { return repo.save(entity); }
    @Override public CrewShiftOverride saveAndFlush(CrewShiftOverride entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<CrewShiftOverride> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(CrewShiftOverride item) { repo.save(item); }
    @Override public void processSyncItems(List<CrewShiftOverride> items) { repo.saveAll(items); }

    @Override
    public Page<CrewShiftOverride> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<CrewShiftOverride> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
