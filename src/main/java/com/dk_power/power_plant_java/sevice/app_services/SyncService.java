package com.dk_power.power_plant_java.sevice.app_services;

import com.dk_power.power_plant_java.api.SyncClient;
import com.dk_power.power_plant_java.entities.SyncStatus;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.repository.SyncStatusRepository;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
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

    private static final String[] ENTITY_NAMES = {
        "Category", "Value", "FileObject", "Equipment",
        "LotoPoint", "LotoStandard", "ZeroEnergy"
    };

    public void syncAll() {
        for (String entityName : ENTITY_NAMES) {
            syncEntity(entityName, serviceFacade.getService(entityName));
        }
    }

    /**
     * Fetch entities from the server since the given date and apply them locally via JPA.
     * Used by partial resync to pull missing data through the same path as real-time sync.
     *
     * @return total number of entities applied
     */
    @SuppressWarnings("unchecked")
    public int syncFromServer(LocalDateTime since) {
        int total = 0;
        for (String entityName : ENTITY_NAMES) {
            SyncableService service = serviceFacade.getService(entityName);
            if (service == null) continue;

            List<? extends BaseIdEntity> serverChanges = getChangesFromServer(entityName, since);
            if (serverChanges != null && !serverChanges.isEmpty()) {
                service.processSyncItems(serverChanges);
                total += serverChanges.size();
                System.out.println(serverChanges.size() + " entities received from server for " + entityName);
            }
        }
        return total;
    }

    public<T extends BaseIdEntity> void saveSyncItems(List<T> changes) {
        if(changes !=null && !changes.isEmpty()){
            String objectType = changes.getFirst().getObjectType();
            System.out.println("Saving " + objectType + " changes...");
            serviceFacade.getService(objectType).processSyncItems(changes);
        }
    }

    @SuppressWarnings("unchecked")
    private <T extends BaseIdEntity, S extends SyncableService> void syncEntity(String entityName, S service) {
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

    @SuppressWarnings("unchecked")
    private <T extends BaseIdEntity, S extends SyncableService> void syncEntityPaginated(String entityName, S service) {
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