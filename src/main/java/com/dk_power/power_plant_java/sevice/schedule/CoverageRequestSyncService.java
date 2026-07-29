package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.repository.schedule.CoverageRequestRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link CoverageRequest} — see {@link CrewPatternSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class CoverageRequestSyncService implements SyncableService<CoverageRequest> {

    private final CoverageRequestRepo repo;

    @Override public CoverageRequest getEntity() { return new CoverageRequest(); }
    @Override public CoverageRequest getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<CoverageRequest> getAll() { return repo.findAll(); }
    @Override public CoverageRequest save(CoverageRequest entity) { return repo.save(entity); }
    @Override public CoverageRequest saveAndFlush(CoverageRequest entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<CoverageRequest> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(CoverageRequest item) { repo.save(item); }
    @Override public void processSyncItems(List<CoverageRequest> items) { repo.saveAll(items); }

    @Override
    public Page<CoverageRequest> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<CoverageRequest> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
