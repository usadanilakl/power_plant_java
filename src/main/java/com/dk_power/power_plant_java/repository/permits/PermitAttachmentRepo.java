package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PermitAttachmentRepo extends JpaRepository<PermitAttachment, Long> {
    List<PermitAttachment> findByEntityTypeAndEntityId(String entityType, Long entityId);
    boolean existsByEntityTypeAndEntityIdAndFileName(String entityType, Long entityId, String fileName);
    boolean existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
        String entityType, Long entityId, String fileName, String contentHash);
    Optional<PermitAttachment> findFirstByEntityTypeAndEntityIdAndFileNameAndContentHashOrderByIdAsc(
        String entityType, Long entityId, String fileName, String contentHash);
    List<PermitAttachment> findBySyncedToServerFalseOrSyncedToServerIsNull();

    @Query("SELECT a FROM PermitAttachment a WHERE a.syncedToMachines IS NULL OR a.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%')")
    List<PermitAttachment> findNotSyncedTo(@Param("machineId") String machineId);
}
