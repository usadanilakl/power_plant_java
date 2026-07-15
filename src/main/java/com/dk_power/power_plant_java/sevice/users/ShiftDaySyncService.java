package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.repository.users.ShiftDayRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SyncableService for {@link ShiftDay}. It is listed in {@code EntityTableRegistry}
 * (table map + SYNC_ORDER) but had no service in {@code ServiceFacade}, so inbound
 * changes hit "No service found for entity type" and the whole batch was dropped —
 * the same silent-drop bug fixed for {@code LotoStandardApprovalEvent} /
 * {@code LotoStandardPendingChange}. Thin pass-through over the repo; scheduling
 * business logic stays on {@code ShiftDayService}.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ShiftDaySyncService implements SyncableService<ShiftDay> {

    private final ShiftDayRepo repo;

    @Override public ShiftDay getEntity() { return new ShiftDay(); }
    @Override public ShiftDay getEntityById(Long id) { return repo.findById(id).orElse(null); }
    @Override public List<ShiftDay> getAll() { return repo.findAll(); }
    @Override public ShiftDay save(ShiftDay entity) { return repo.save(entity); }
    @Override public ShiftDay saveAndFlush(ShiftDay entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
        });
    }

    @Override public List<ShiftDay> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }
    @Override public void processSyncItem(ShiftDay item) { repo.save(item); }
    @Override public void processSyncItems(List<ShiftDay> items) { repo.saveAll(items); }

    @Override
    public Page<ShiftDay> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<ShiftDay> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
