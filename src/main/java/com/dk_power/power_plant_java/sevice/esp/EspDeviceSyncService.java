package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.repository.esp.EspDeviceRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link EspDevice}. EspDevice was in EntityTableRegistry but had no service,
 * so its changes were silently dropped on apply. Registered so ESP device config propagates across
 * devices. Thin pass-through over the repo; device business logic stays on the ESP services.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class EspDeviceSyncService implements SyncableService<EspDevice> {

    private final EspDeviceRepo repo;

    @Override public EspDevice getEntity() { return new EspDevice(); }
    @Override public EspDevice getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<EspDevice> getAll() { return repo.findAll(); }
    @Override public EspDevice save(EspDevice entity) { return repo.save(entity); }
    @Override public EspDevice saveAndFlush(EspDevice entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<EspDevice> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(EspDevice item) { repo.save(item); }
    @Override public void processSyncItems(List<EspDevice> items) { repo.saveAll(items); }

    @Override
    public Page<EspDevice> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<EspDevice> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
