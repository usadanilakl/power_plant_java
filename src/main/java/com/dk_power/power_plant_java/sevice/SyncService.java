package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.SyncStatus;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.repository.SyncStatusRepository;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SyncService {
    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private SyncStatusRepository syncStatusRepository;

    // Repositories for all entities that need syncing
    @Autowired
    private EquipmentRepo equipmentRepository;
    // ... other repositories

    public void syncWithServer() {
        syncEntity("Equipment", equipmentRepository);
        // ... sync other entities
    }

    private <T extends BaseIdEntity> void syncEntity(String entityName, JpaRepository<T, Long> repository) {
        SyncStatus status = syncStatusRepository.findById(entityName)
            .orElse(new SyncStatus(entityName, LocalDateTime.MIN));

        List<T> localChanges = repository.findByLastModifiedAfter(status.getLastSyncTime());
        sendChangesToServer(entityName, localChanges);

        List<T> serverChanges = getChangesFromServer(entityName, status.getLastSyncTime());
        applyServerChanges(repository, serverChanges);

        status.setLastSyncTime(LocalDateTime.now());
        syncStatusRepository.save(status);
    }

    private <T extends BaseIdEntity> void sendChangesToServer(String entityName, List<T> changes) {
        restTemplate.postForObject("/sync/" + entityName, changes, Void.class);
    }

    private <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since) {
        return restTemplate.getForObject("/sync/" + entityName + "?since=" + since, List.class);
    }

    private <T extends BaseIdEntity> void applyServerChanges(JpaRepository<T, Long> repository, List<T> changes) {
        repository.saveAll(changes);
    }
}