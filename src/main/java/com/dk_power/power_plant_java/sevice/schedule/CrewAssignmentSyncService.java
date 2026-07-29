package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.repository.schedule.CrewAssignmentRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link CrewAssignment} — see {@link CrewPatternSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class CrewAssignmentSyncService implements SyncableService<CrewAssignment> {

    private final CrewAssignmentRepo repo;

    @Override public CrewAssignment getEntity() { return new CrewAssignment(); }
    @Override public CrewAssignment getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<CrewAssignment> getAll() { return repo.findAll(); }
    @Override public CrewAssignment save(CrewAssignment entity) { return repo.save(entity); }
    @Override public CrewAssignment saveAndFlush(CrewAssignment entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<CrewAssignment> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(CrewAssignment item) { repo.save(item); }
    @Override public void processSyncItems(List<CrewAssignment> items) { repo.saveAll(items); }

    @Override
    public Page<CrewAssignment> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<CrewAssignment> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
