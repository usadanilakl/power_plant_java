package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.entities.loto.WalkdownSession;
import com.dk_power.power_plant_java.repository.loto.WalkdownSessionRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link WalkdownSession} — per-crew walkdown records on
 * a LOTO permit. Separate from the business service {@link NgWalkdownSessionService}
 * to keep the sync surface minimal and avoid tangling the role-gated request/
 * complete methods into the sync applier. Pattern mirrors {@code NgLotoSnapshotService}
 * — thin pass-through over the repo so
 * {@link com.dk_power.power_plant_java.sevice.ServiceFacade#getService(String)}
 * returns non-null for entity type {@code "WalkdownSession"}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NgWalkdownSessionSyncService implements SyncableService<WalkdownSession> {

    private final WalkdownSessionRepo repo;

    @Override public WalkdownSession getEntity() { return new WalkdownSession(); }
    @Override public WalkdownSession getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<WalkdownSession> getAll() { return repo.findAll(); }
    @Override public WalkdownSession save(WalkdownSession entity) { return repo.save(entity); }
    @Override public WalkdownSession saveAndFlush(WalkdownSession entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<WalkdownSession> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(WalkdownSession item) { repo.save(item); }
    @Override public void processSyncItems(List<WalkdownSession> items) { repo.saveAll(items); }

    @Override
    public Page<WalkdownSession> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<WalkdownSession> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
