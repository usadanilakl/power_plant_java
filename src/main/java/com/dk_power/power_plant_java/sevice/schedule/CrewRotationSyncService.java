package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.CrewRotation;
import com.dk_power.power_plant_java.repository.schedule.CrewRotationRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link CrewRotation} — see {@link CrewSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class CrewRotationSyncService implements SyncableService<CrewRotation> {

    private final CrewRotationRepo repo;

    @Override public CrewRotation getEntity() { return new CrewRotation(); }
    @Override public CrewRotation getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<CrewRotation> getAll() { return repo.findAll(); }
    @Override public CrewRotation save(CrewRotation entity) { return repo.save(entity); }
    @Override public CrewRotation saveAndFlush(CrewRotation entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<CrewRotation> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(CrewRotation item) { repo.save(item); }
    @Override public void processSyncItems(List<CrewRotation> items) { repo.saveAll(items); }

    @Override
    public Page<CrewRotation> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<CrewRotation> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
