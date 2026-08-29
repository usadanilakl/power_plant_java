package com.dk_power.power_plant_java.sevice.physical;

import com.dk_power.power_plant_java.entities.physical.PlantMapTopologyConnection;
import com.dk_power.power_plant_java.repository.physical.PlantMapTopologyConnectionRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Makes canonical Plant Map connections participate in the normal field-change sync pipeline. */
@Service
@Transactional
@RequiredArgsConstructor
public class PlantMapTopologyConnectionSyncService implements SyncableService<PlantMapTopologyConnection> {

    private final PlantMapTopologyConnectionRepo repo;

    @Override public PlantMapTopologyConnection getEntity() { return new PlantMapTopologyConnection(); }
    @Override public PlantMapTopologyConnection getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<PlantMapTopologyConnection> getAll() { return repo.findAll(); }
    @Override public PlantMapTopologyConnection save(PlantMapTopologyConnection entity) { return repo.save(entity); }
    @Override public PlantMapTopologyConnection saveAndFlush(PlantMapTopologyConnection entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<PlantMapTopologyConnection> getAllSince(LocalDateTime since) {
        return repo.findAllByDateModifiedAfter(since);
    }
    @Override public void processSyncItem(PlantMapTopologyConnection item) { repo.save(item); }
    @Override public void processSyncItems(List<PlantMapTopologyConnection> items) { repo.saveAll(items); }

    @Override
    public Page<PlantMapTopologyConnection> getAllSincePaginated(LocalDateTime since, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(since, pageable);
    }

    @Override
    public Page<PlantMapTopologyConnection> getAllSinceAndUntilPaginated(
        LocalDateTime since, LocalDateTime until, Pageable pageable
    ) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
