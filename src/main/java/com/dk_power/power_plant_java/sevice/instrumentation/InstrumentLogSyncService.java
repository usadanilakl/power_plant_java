package com.dk_power.power_plant_java.sevice.instrumentation;

import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentLogRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InstrumentLogSyncService implements SyncableService<InstrumentLog> {

    private final InstrumentLogRepo instrumentLogRepo;

    @Override
    public InstrumentLog getEntity() {
        return new InstrumentLog();
    }

    @Override
    public InstrumentLog getEntityById(Long id) {
        return instrumentLogRepo.findById(id).orElse(null);
    }

    @Override
    public List<InstrumentLog> getAll() {
        return instrumentLogRepo.findAll();
    }

    @Override
    public InstrumentLog save(InstrumentLog entity) {
        return instrumentLogRepo.save(entity);
    }

    @Override
    public InstrumentLog saveAndFlush(InstrumentLog entity) {
        return instrumentLogRepo.saveAndFlush(entity);
    }

    @Override
    public void deleteById(Long id) {
        instrumentLogRepo.deleteById(id);
    }

    @Override
    public List<InstrumentLog> getAllSince(LocalDateTime since) {
        return instrumentLogRepo.findAllByDateModifiedAfter(since);
    }

    @Override
    public void processSyncItem(InstrumentLog item) {
        if (item != null && item.getId() != null) {
            instrumentLogRepo.saveAndFlush(item);
        }
    }

    @Override
    public void processSyncItems(List<InstrumentLog> items) {
        if (items != null && !items.isEmpty()) {
            items.forEach(this::processSyncItem);
        }
    }

    @Override
    public Page<InstrumentLog> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return instrumentLogRepo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<InstrumentLog> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return instrumentLogRepo.findAllByDateModifiedBetween(since, until, pageable);
    }
}

