package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.api.SyncClient;
import com.dk_power.power_plant_java.entities.SyncStatus;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.repository.SyncStatusRepository;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.formula.functions.T;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SyncService {

    private final JpaRepository<BaseIdEntity, Long> repository;

    private final SyncClient syncClient;
    private final SyncStatusRepository syncStatusRepository;
    private final EquipmentService equipmentService;
    private final LotoPointService lotoPointService;
    private final CategoryService categoryService;
    private final ValueService valueService;
    private final FileService fileService;

    public void syncAll() {
        syncEntity("Category", categoryService);
        syncEntity("Value", valueService);
        syncEntity("FileObject", fileService);
        syncEntity("Equipment", equipmentService);
        syncEntity("LotoPoint", lotoPointService);
    }

    public<T extends BaseIdEntity> void saveSyncItems(List<T> changes) {
        repository.saveAllAndFlush(changes);
    }

    private <T extends BaseIdEntity, S extends CrudService> void syncEntity(String entityName, S service) {
        SyncStatus status = syncStatusRepository.findById(entityName)
            .orElse(new SyncStatus(entityName, LocalDateTime.MIN));

        List<T> localChanges = service.getAllSince(status.getLastSyncTime());
        sendChangesToServer(entityName, localChanges);

        List<T> serverChanges = getChangesFromServer(entityName, status.getLastSyncTime());
        service.processSyncItems(serverChanges);

        status.setLastSyncTime(LocalDateTime.now());
        syncStatusRepository.save(status);
    }

    private <T extends BaseIdEntity> void sendChangesToServer(String entityName, List<T> changes) {
        syncClient.sendChangesToServer(entityName, changes);
    }

    private <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since) {
        return syncClient.getChangesFromServer(entityName, since);
    }

}