package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SdsChemicalSyncService implements SyncableService<SdsChemical> {

    private final SdsChemicalRepo repo;

    @Override public SdsChemical getEntity() { return new SdsChemical(); }
    @Override public SdsChemical getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<SdsChemical> getAll() { return repo.findAll(); }
    @Override public SdsChemical save(SdsChemical entity) { return repo.save(entity); }
    @Override public SdsChemical saveAndFlush(SdsChemical entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<SdsChemical> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(SdsChemical item) { repo.save(item); }
    @Override public void processSyncItems(List<SdsChemical> items) { repo.saveAll(items); }

    @Override
    public Page<SdsChemical> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<SdsChemical> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
