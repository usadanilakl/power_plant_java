package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.repository.esp.LedStripRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link LedStrip}. LedStrip was in EntityTableRegistry but had no service, so
 * its changes were silently dropped on apply. Registered so LED-strip config propagates across
 * devices. Thin pass-through over the repo.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class LedStripSyncService implements SyncableService<LedStrip> {

    private final LedStripRepo repo;

    @Override public LedStrip getEntity() { return new LedStrip(); }
    @Override public LedStrip getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<LedStrip> getAll() { return repo.findAll(); }
    @Override public LedStrip save(LedStrip entity) { return repo.save(entity); }
    @Override public LedStrip saveAndFlush(LedStrip entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<LedStrip> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(LedStrip item) { repo.save(item); }
    @Override public void processSyncItems(List<LedStrip> items) { repo.saveAll(items); }

    @Override
    public Page<LedStrip> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<LedStrip> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
