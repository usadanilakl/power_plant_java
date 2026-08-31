package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.entities.loto.LotoBypassAudit;
import com.dk_power.power_plant_java.repository.loto.LotoBypassAuditRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Makes Red-Tag LOTO bypass audit rows participate in the normal field-change sync pipeline.
 *
 * <p>{@link LotoBypassAudit} was made a {@code BaseIdEntity} specifically so its rows sync — a CA on
 * another desktop should see the same bypass history without a separate export (see the entity's
 * Javadoc). But it had no {@code EntityTableRegistry} entry and no {@code SyncableService}, so the
 * fail-loud {@code SyncRegistryValidator} flagged it as {@code registered=false, service=false} and its
 * changes were being SILENTLY DROPPED on the hub. This service closes that gap.
 *
 * <p>All date-window methods delegate to {@link com.dk_power.power_plant_java.repository.base_repositories.BaseRepository},
 * which already provides {@code findAllByDateModifiedAfter/Between}. The audit holds no {@code Value}
 * references, so the {@code refactorValues}/{@code findByValue} interface defaults (empty) are correct.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class LotoBypassAuditSyncService implements SyncableService<LotoBypassAudit> {

    private final LotoBypassAuditRepo repo;

    @Override public LotoBypassAudit getEntity() { return new LotoBypassAudit(); }
    @Override public LotoBypassAudit getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<LotoBypassAudit> getAll() { return repo.findAll(); }
    @Override public LotoBypassAudit save(LotoBypassAudit entity) { return repo.save(entity); }
    @Override public LotoBypassAudit saveAndFlush(LotoBypassAudit entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<LotoBypassAudit> getAllSince(LocalDateTime since) {
        return repo.findAllByDateModifiedAfter(since);
    }
    @Override public void processSyncItem(LotoBypassAudit item) { repo.save(item); }
    @Override public void processSyncItems(List<LotoBypassAudit> items) { repo.saveAll(items); }

    @Override
    public Page<LotoBypassAudit> getAllSincePaginated(LocalDateTime since, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(since, pageable);
    }

    @Override
    public Page<LotoBypassAudit> getAllSinceAndUntilPaginated(
            LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
