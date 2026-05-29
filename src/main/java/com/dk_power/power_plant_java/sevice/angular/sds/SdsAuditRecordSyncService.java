package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.entities.sds.SdsAuditRecord;
import com.dk_power.power_plant_java.repository.sds.SdsAuditRecordRepo;
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
public class SdsAuditRecordSyncService implements SyncableService<SdsAuditRecord> {

    private final SdsAuditRecordRepo repo;

    @Override public SdsAuditRecord getEntity() { return new SdsAuditRecord(); }
    @Override public SdsAuditRecord getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<SdsAuditRecord> getAll() { return repo.findAll(); }
    @Override public SdsAuditRecord save(SdsAuditRecord entity) { return repo.save(entity); }
    @Override public SdsAuditRecord saveAndFlush(SdsAuditRecord entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<SdsAuditRecord> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(SdsAuditRecord item) { repo.save(item); }
    @Override public void processSyncItems(List<SdsAuditRecord> items) { repo.saveAll(items); }

    @Override
    public Page<SdsAuditRecord> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<SdsAuditRecord> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
