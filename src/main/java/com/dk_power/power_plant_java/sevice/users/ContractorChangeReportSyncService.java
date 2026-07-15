package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.entities.users.ContractorChangeReport;
import com.dk_power.power_plant_java.repository.users.ContractorChangeReportRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link ContractorChangeReport}. It is listed in
 * {@code EntityTableRegistry} (table map + SYNC_ORDER) but had no service in
 * {@code ServiceFacade}, so inbound changes hit "No service found for entity type"
 * and the whole batch was dropped — the same silent-drop bug fixed for
 * {@code LotoStandardApprovalEvent}. Thin pass-through over the repo; contractor
 * reconciliation logic stays on {@code ContractorSyncService}/{@code ContractorReconciler}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ContractorChangeReportSyncService implements SyncableService<ContractorChangeReport> {

    private final ContractorChangeReportRepo repo;

    @Override public ContractorChangeReport getEntity() { return new ContractorChangeReport(); }
    @Override public ContractorChangeReport getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<ContractorChangeReport> getAll() { return repo.findAll(); }
    @Override public ContractorChangeReport save(ContractorChangeReport entity) { return repo.save(entity); }
    @Override public ContractorChangeReport saveAndFlush(ContractorChangeReport entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<ContractorChangeReport> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(ContractorChangeReport item) { repo.save(item); }
    @Override public void processSyncItems(List<ContractorChangeReport> items) { repo.saveAll(items); }

    @Override
    public Page<ContractorChangeReport> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<ContractorChangeReport> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
