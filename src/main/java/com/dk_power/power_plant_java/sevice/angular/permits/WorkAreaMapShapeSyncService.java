package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.WorkAreaMapShape;
import com.dk_power.power_plant_java.repository.permits.WorkAreaMapShapeRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkAreaMapShapeSyncService implements SyncableService<WorkAreaMapShape> {

    private final WorkAreaMapShapeRepo workAreaMapShapeRepo;

    @Override
    public WorkAreaMapShape getEntity() {
        return new WorkAreaMapShape();
    }

    @Override
    public WorkAreaMapShape getEntityById(Long id) {
        return workAreaMapShapeRepo.findById(id).orElse(null);
    }

    @Override
    public List<WorkAreaMapShape> getAll() {
        return workAreaMapShapeRepo.findAll();
    }

    @Override
    public WorkAreaMapShape save(WorkAreaMapShape entity) {
        return workAreaMapShapeRepo.save(entity);
    }

    @Override
    public WorkAreaMapShape saveAndFlush(WorkAreaMapShape entity) {
        return workAreaMapShapeRepo.saveAndFlush(entity);
    }

    @Override
    public void deleteById(Long id) {
        workAreaMapShapeRepo.deleteById(id);
    }

    @Override
    public List<WorkAreaMapShape> getAllSince(LocalDateTime since) {
        return workAreaMapShapeRepo.findAllByDateModifiedAfter(since);
    }

    @Override
    public void processSyncItem(WorkAreaMapShape item) {
        if (item != null && item.getId() != null) {
            workAreaMapShapeRepo.saveAndFlush(item);
        }
    }

    @Override
    public void processSyncItems(List<WorkAreaMapShape> items) {
        if (items != null && !items.isEmpty()) {
            items.forEach(this::processSyncItem);
        }
    }

    @Override
    public Page<WorkAreaMapShape> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return workAreaMapShapeRepo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<WorkAreaMapShape> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return workAreaMapShapeRepo.findAllByDateModifiedBetween(since, until, pageable);
    }
}
