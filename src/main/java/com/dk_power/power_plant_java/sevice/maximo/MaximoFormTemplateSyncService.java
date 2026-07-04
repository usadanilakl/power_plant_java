package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.entities.maximo.MaximoFormTemplate;
import com.dk_power.power_plant_java.repository.maximo.MaximoFormTemplateRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link MaximoFormTemplate} so authored templates replicate to every device. */
@Service
@Transactional
@RequiredArgsConstructor
public class MaximoFormTemplateSyncService implements SyncableService<MaximoFormTemplate> {

    private final MaximoFormTemplateRepo repo;

    @Override public MaximoFormTemplate getEntity() { return new MaximoFormTemplate(); }
    @Override public MaximoFormTemplate getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<MaximoFormTemplate> getAll() { return repo.findAll(); }
    @Override public MaximoFormTemplate save(MaximoFormTemplate entity) { return repo.save(entity); }
    @Override public MaximoFormTemplate saveAndFlush(MaximoFormTemplate entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(e -> { e.setDeleted(true); repo.save(e); });
    }

    @Override public List<MaximoFormTemplate> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(MaximoFormTemplate item) { repo.save(item); }
    @Override public void processSyncItems(List<MaximoFormTemplate> items) { repo.saveAll(items); }

    @Override
    public Page<MaximoFormTemplate> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<MaximoFormTemplate> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
