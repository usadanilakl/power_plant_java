package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.OnCallRotation;
import com.dk_power.power_plant_java.repository.schedule.OnCallRotationRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link OnCallRotation} — see {@link CrewSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class OnCallRotationSyncService implements SyncableService<OnCallRotation> {

    private final OnCallRotationRepo repo;

    @Override public OnCallRotation getEntity() { return new OnCallRotation(); }
    @Override public OnCallRotation getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<OnCallRotation> getAll() { return repo.findAll(); }
    @Override public OnCallRotation save(OnCallRotation entity) { return repo.save(entity); }
    @Override public OnCallRotation saveAndFlush(OnCallRotation entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<OnCallRotation> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(OnCallRotation item) { repo.save(item); }
    @Override public void processSyncItems(List<OnCallRotation> items) { repo.saveAll(items); }

    @Override
    public Page<OnCallRotation> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<OnCallRotation> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
