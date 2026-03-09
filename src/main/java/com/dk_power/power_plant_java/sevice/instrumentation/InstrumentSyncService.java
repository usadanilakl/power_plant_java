package com.dk_power.power_plant_java.sevice.instrumentation;

import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InstrumentSyncService implements SyncableService<Instrument> {

    private final InstrumentRepo instrumentRepo;

    @Override
    public Instrument getEntity() {
        return new Instrument();
    }

    @Override
    public Instrument getEntityById(Long id) {
        return instrumentRepo.findById(id).orElse(null);
    }

    @Override
    public List<Instrument> getAll() {
        return instrumentRepo.findAll();
    }

    @Override
    public Instrument save(Instrument entity) {
        return instrumentRepo.save(entity);
    }

    @Override
    public Instrument saveAndFlush(Instrument entity) {
        return instrumentRepo.saveAndFlush(entity);
    }

    @Override
    public void deleteById(Long id) {
        instrumentRepo.deleteById(id);
    }

    @Override
    public List<Instrument> getAllSince(LocalDateTime since) {
        return instrumentRepo.findAllByDateModifiedAfter(since);
    }

    @Override
    public void processSyncItem(Instrument item) {
        if (item != null && item.getId() != null) {
            instrumentRepo.saveAndFlush(item);
        }
    }

    @Override
    public void processSyncItems(List<Instrument> items) {
        if (items != null && !items.isEmpty()) {
            items.forEach(this::processSyncItem);
        }
    }

    @Override
    public Page<Instrument> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return instrumentRepo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<Instrument> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return instrumentRepo.findAllByDateModifiedBetween(since, until, pageable);
    }
}

