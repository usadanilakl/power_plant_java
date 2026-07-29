package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.repository.schedule.ScheduleEventRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link ScheduleEvent} — see {@link CrewPatternSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class ScheduleEventSyncService implements SyncableService<ScheduleEvent> {

    private final ScheduleEventRepo repo;

    @Override public ScheduleEvent getEntity() { return new ScheduleEvent(); }
    @Override public ScheduleEvent getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<ScheduleEvent> getAll() { return repo.findAll(); }
    @Override public ScheduleEvent save(ScheduleEvent entity) { return repo.save(entity); }
    @Override public ScheduleEvent saveAndFlush(ScheduleEvent entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<ScheduleEvent> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(ScheduleEvent item) { repo.save(item); }
    @Override public void processSyncItems(List<ScheduleEvent> items) { repo.saveAll(items); }

    @Override
    public Page<ScheduleEvent> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<ScheduleEvent> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
