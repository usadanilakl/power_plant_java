package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.ReliefRotation;
import com.dk_power.power_plant_java.repository.schedule.ReliefRotationRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link ReliefRotation} — see {@link CrewSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class ReliefRotationSyncService implements SyncableService<ReliefRotation> {

    private final ReliefRotationRepo repo;

    @Override public ReliefRotation getEntity() { return new ReliefRotation(); }
    @Override public ReliefRotation getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<ReliefRotation> getAll() { return repo.findAll(); }
    @Override public ReliefRotation save(ReliefRotation entity) { return repo.save(entity); }
    @Override public ReliefRotation saveAndFlush(ReliefRotation entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<ReliefRotation> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(ReliefRotation item) { repo.save(item); }
    @Override public void processSyncItems(List<ReliefRotation> items) { repo.saveAll(items); }

    @Override
    public Page<ReliefRotation> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<ReliefRotation> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
