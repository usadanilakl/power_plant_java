package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.repository.schedule.CoverageSignupRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link CoverageSignup} — see {@link CrewPatternSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class CoverageSignupSyncService implements SyncableService<CoverageSignup> {

    private final CoverageSignupRepo repo;

    @Override public CoverageSignup getEntity() { return new CoverageSignup(); }
    @Override public CoverageSignup getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<CoverageSignup> getAll() { return repo.findAll(); }
    @Override public CoverageSignup save(CoverageSignup entity) { return repo.save(entity); }
    @Override public CoverageSignup saveAndFlush(CoverageSignup entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<CoverageSignup> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(CoverageSignup item) { repo.save(item); }
    @Override public void processSyncItems(List<CoverageSignup> items) { repo.saveAll(items); }

    @Override
    public Page<CoverageSignup> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<CoverageSignup> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
