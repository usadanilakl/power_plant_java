package com.dk_power.power_plant_java.sevice.schedule;

import com.dk_power.power_plant_java.entities.schedule.PtoRequest;
import com.dk_power.power_plant_java.repository.schedule.PtoRequestRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link PtoRequest} — see {@link CrewPatternSyncService} for rationale. */
@Service
@Transactional
@RequiredArgsConstructor
public class PtoRequestSyncService implements SyncableService<PtoRequest> {

    private final PtoRequestRepo repo;

    @Override public PtoRequest getEntity() { return new PtoRequest(); }
    @Override public PtoRequest getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<PtoRequest> getAll() { return repo.findAll(); }
    @Override public PtoRequest save(PtoRequest entity) { return repo.save(entity); }
    @Override public PtoRequest saveAndFlush(PtoRequest entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<PtoRequest> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(PtoRequest item) { repo.save(item); }
    @Override public void processSyncItems(List<PtoRequest> items) { repo.saveAll(items); }

    @Override
    public Page<PtoRequest> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<PtoRequest> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
