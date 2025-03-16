package com.dk_power.power_plant_java.sevice.sync_and_backup;

import com.dk_power.power_plant_java.api.SyncClient;
import com.dk_power.power_plant_java.entities.SyncStatus;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.repository.SyncStatusRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SyncService {

    private final SyncClient syncClient;
    private final SyncStatusRepository syncStatusRepository;
    private final ServiceFacade serviceFacade;

    public void syncAll() {
        syncEntity("Category", serviceFacade.getService("Category"));
        syncEntity("Value", serviceFacade.getService("Value"));
        syncEntity("FileObject", serviceFacade.getService("FileObject"));
        syncEntity("Equipment", serviceFacade.getService("Equipment"));
        syncEntity("LotoPoint", serviceFacade.getService("LotoPoint"));
    }

    public<T extends BaseIdEntity> void saveSyncItems(List<T> changes) {
        if(changes !=null && !changes.isEmpty()){
            String objectType = changes.getFirst().getObjectType();
            System.out.println("Saving " + objectType + " changes...");
            serviceFacade.getService(objectType).processSyncItems(changes);
        }
    }

    private <T extends BaseIdEntity, S extends CrudService> void syncEntity(String entityName, S service) {
        SyncStatus status = syncStatusRepository.findById(entityName)
            .orElse(new SyncStatus(entityName, LocalDateTime.of(2000, 1, 1, 0, 0)));

        List<T> localChanges = service.getAllSince(status.getLastSyncTime());
        if(localChanges!=null &&!localChanges.isEmpty()){
            sendChangesToServer(entityName, localChanges);
            System.out.println(localChanges.size() + " changes sent to server for " + entityName);
        }

        List<T> serverChanges = getChangesFromServer(entityName, status.getLastSyncTime());
        if(serverChanges!=null &&!serverChanges.isEmpty()){
            service.processSyncItems(serverChanges);
            System.out.println(serverChanges.size() + " changes received from server for " + entityName);
        }

        status.setLastSyncTime(LocalDateTime.now());
        syncStatusRepository.save(status);
    }

    private <T extends BaseIdEntity> void sendChangesToServer(String entityName, List<T> changes) {
        syncClient.sendChangesToServer(entityName, changes);
    }

    private <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since) {
        return syncClient.getChangesFromServer(entityName, since);
    }


    //PAGINATION AND LIMITATION
    private static final int BATCH_SIZE = 1000; // Adjust this value based on your needs

    private <T extends BaseIdEntity, S extends CrudService> void syncEntityPaginated(String entityName, S service) {
        SyncStatus status = syncStatusRepository.findById(entityName)
                .orElse(new SyncStatus(entityName, LocalDateTime.MIN));
        LocalDateTime untilBeforeSync = LocalDateTime.now();

        // Process local changes in batches
        int page = 0;
        while (true) {
            Pageable pageable = PageRequest.of(page, BATCH_SIZE);
            Page<T> localChangesPage = service.getAllSincePaginated(status.getLastSyncTime(), pageable);

            if (localChangesPage.hasContent()) {
                List<T> localChanges = localChangesPage.getContent();
                sendChangesToServer(entityName, localChanges);
                System.out.println(localChanges.size() + " changes sent to server for " + entityName + " (page " + (page + 1) + ")");
            }

            if (!localChangesPage.hasNext()) {
                break;
            }
            page++;
        }

        // Process server changes in batches
        LocalDateTime lastServerSync = status.getLastSyncTime();
        while (true) {
            List<T> serverChanges = getChangesFromServer(entityName, lastServerSync, BATCH_SIZE, untilBeforeSync);
            if (serverChanges == null || serverChanges.isEmpty()) {
                break;
            }

            service.processSyncItems(serverChanges);
            System.out.println(serverChanges.size() + " changes received from server for " + entityName);

            lastServerSync = serverChanges.stream()
                    .map(BaseIdEntity::getDateModified)
                    .max(LocalDateTime::compareTo)
                    .orElse(lastServerSync);
        }

        status.setLastSyncTime(LocalDateTime.now());
        syncStatusRepository.save(status);
    }


    private <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since, int limit) {
        return syncClient.getChangesFromServer(entityName, since, limit);
    }

    private <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since, int limit, LocalDateTime until) {
        return syncClient.getChangesFromServer(entityName, since, limit, until);
    }
}