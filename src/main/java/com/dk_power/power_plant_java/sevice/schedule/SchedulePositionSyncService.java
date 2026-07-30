package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.SchedulePosition;
import com.dk_power.power_plant_java.repository.schedule.SchedulePositionRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link SchedulePosition} — see {@link CrewSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class SchedulePositionSyncService implements SyncableService<SchedulePosition> {

    private final SchedulePositionRepo repo;

    @Override public SchedulePosition getEntity() { return new SchedulePosition(); }
    @Override public SchedulePosition getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<SchedulePosition> getAll() { return repo.findAll(); }
    @Override public SchedulePosition save(SchedulePosition entity) { return repo.save(entity); }
    @Override public SchedulePosition saveAndFlush(SchedulePosition entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<SchedulePosition> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(SchedulePosition item) { repo.save(item); }
    @Override public void processSyncItems(List<SchedulePosition> items) { repo.saveAll(items); }

    @Override
    public Page<SchedulePosition> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<SchedulePosition> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
