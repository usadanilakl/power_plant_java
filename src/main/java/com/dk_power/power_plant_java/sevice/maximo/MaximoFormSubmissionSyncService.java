package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.entities.maximo.MaximoFormSubmission;
import com.dk_power.power_plant_java.repository.maximo.MaximoFormSubmissionRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** SyncableService for {@link MaximoFormSubmission} so filled forms replicate to every device. */
@Service
@Transactional
@RequiredArgsConstructor
public class MaximoFormSubmissionSyncService implements SyncableService<MaximoFormSubmission> {

    private final MaximoFormSubmissionRepo repo;

    @Override public MaximoFormSubmission getEntity() { return new MaximoFormSubmission(); }
    @Override public MaximoFormSubmission getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<MaximoFormSubmission> getAll() { return repo.findAll(); }
    @Override public MaximoFormSubmission save(MaximoFormSubmission entity) { return repo.save(entity); }
    @Override public MaximoFormSubmission saveAndFlush(MaximoFormSubmission entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(e -> { e.setDeleted(true); repo.save(e); });
    }

    @Override public List<MaximoFormSubmission> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(MaximoFormSubmission item) { repo.save(item); }
    @Override public void processSyncItems(List<MaximoFormSubmission> items) { repo.saveAll(items); }

    @Override
    public Page<MaximoFormSubmission> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<MaximoFormSubmission> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
