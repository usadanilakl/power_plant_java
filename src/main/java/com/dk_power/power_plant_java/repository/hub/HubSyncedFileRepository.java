package com.dk_power.power_plant_java.repository.hub;

import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
public interface HubSyncedFileRepository extends JpaRepository<HubSyncedFile, Long> {

    List<HubSyncedFile> findByEntityTypeAndEntityIdAndDeletedFalse(String entityType, Long entityId);

    Optional<HubSyncedFile> findByFileHashAndEntityTypeAndEntityIdAndDeletedFalse(
            String fileHash, String entityType, Long entityId);

    @Query("SELECT f FROM HubSyncedFile f WHERE f.deleted = false AND f.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%')")
    List<HubSyncedFile> findFilesNotSyncedTo(@Param("machineId") String machineId);

    @Query("SELECT COUNT(f) FROM HubSyncedFile f WHERE f.deleted = false AND f.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%')")
    long countFilesPendingFor(@Param("machineId") String machineId);

    @Query("SELECT SUM(f.fileSize) FROM HubSyncedFile f WHERE f.deleted = false")
    Long totalStorageUsed();
}
