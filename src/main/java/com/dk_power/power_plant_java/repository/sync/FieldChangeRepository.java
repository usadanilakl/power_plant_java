package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FieldChangeRepository extends JpaRepository<FieldChange, UUID> {

    // Get changes not yet synced to a specific machine (legacy - use paginated version for large datasets)
    @Query("SELECT fc FROM FieldChange fc WHERE fc.syncedToMachines NOT LIKE CONCAT('%', :machineId, '%') ORDER BY fc.timestamp ASC")
    List<FieldChange> findChangesNotSyncedTo(@Param("machineId") String machineId);

    // PAGINATED: Get changes not yet synced to a specific machine
    @Query("SELECT fc FROM FieldChange fc WHERE fc.syncedToMachines NOT LIKE CONCAT('%', :machineId, '%') ORDER BY fc.timestamp ASC")
    Page<FieldChange> findChangesNotSyncedTo(@Param("machineId") String machineId, Pageable pageable);

    // Get changes since a timestamp, excluding a specific machine's own changes
    @Query("SELECT fc FROM FieldChange fc WHERE fc.timestamp > :since AND fc.originMachineId != :machineId ORDER BY fc.timestamp ASC")
    List<FieldChange> findChangesSince(@Param("since") Instant since, @Param("machineId") String excludeMachineId);

    // Get changes since a timestamp (all machines)
    List<FieldChange> findByTimestampAfterOrderByTimestampAsc(Instant since);

    // Get the latest change for a specific field
    @Query("SELECT fc FROM FieldChange fc WHERE fc.entityType = :entityType AND fc.entityId = :entityId AND fc.fieldName = :fieldName ORDER BY fc.timestamp DESC")
    List<FieldChange> findLatestChanges(@Param("entityType") String entityType,
                                        @Param("entityId") Long entityId,
                                        @Param("fieldName") String fieldName);

    default Optional<FieldChange> findLatestChange(String entityType, Long entityId, String fieldName) {
        List<FieldChange> changes = findLatestChanges(entityType, entityId, fieldName);
        return changes.isEmpty() ? Optional.empty() : Optional.of(changes.get(0));
    }

    // Get all changes for an entity (for conflict resolution UI)
    List<FieldChange> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);

    // Get all changes for a specific entity type since timestamp
    List<FieldChange> findByEntityTypeAndTimestampAfterOrderByTimestampAsc(String entityType, Instant since);

    // Count pending changes to sync for a machine
    @Query("SELECT COUNT(fc) FROM FieldChange fc WHERE fc.syncedToMachines NOT LIKE CONCAT('%', :machineId, '%')")
    long countPendingChangesFor(@Param("machineId") String machineId);

    // Count total changes
    long count();

    // Cleanup old changes (retention policy)
    @Modifying
    @Query("DELETE FROM FieldChange fc WHERE fc.timestamp < :before")
    int deleteChangesBefore(@Param("before") Instant before);

    // Check if change already exists (for deduplication)
    boolean existsByEntityTypeAndEntityIdAndFieldNameAndTimestampAndOriginMachineId(
        String entityType, Long entityId, String fieldName, Instant timestamp, String originMachineId);

    // Find by origin machine
    List<FieldChange> findByOriginMachineIdOrderByTimestampDesc(String machineId);

    // Get changes for multiple entities
    @Query("SELECT fc FROM FieldChange fc WHERE fc.entityType = :entityType AND fc.entityId IN :entityIds ORDER BY fc.timestamp ASC")
    List<FieldChange> findByEntityTypeAndEntityIdIn(@Param("entityType") String entityType, @Param("entityIds") List<Long> entityIds);

    // BATCH: Get latest changes for multiple entity/field combinations (for batch conflict resolution)
    // Returns the latest change for each unique (entityType, entityId, fieldName) combination
    @Query("SELECT fc FROM FieldChange fc WHERE fc.id IN (" +
           "SELECT fc2.id FROM FieldChange fc2 WHERE fc2.timestamp = (" +
           "SELECT MAX(fc3.timestamp) FROM FieldChange fc3 " +
           "WHERE fc3.entityType = fc2.entityType AND fc3.entityId = fc2.entityId AND fc3.fieldName = fc2.fieldName" +
           ") AND fc2.entityType = :entityType AND fc2.entityId IN :entityIds)")
    List<FieldChange> findLatestChangesForEntities(@Param("entityType") String entityType, @Param("entityIds") List<Long> entityIds);

    // BATCH: Check for existing changes (batch deduplication) - returns matching keys
    @Query("SELECT CONCAT(fc.entityType, ':', fc.entityId, ':', fc.fieldName, ':', fc.timestamp, ':', fc.originMachineId) " +
           "FROM FieldChange fc WHERE fc.entityType = :entityType AND fc.entityId IN :entityIds")
    List<String> findExistingChangeKeys(@Param("entityType") String entityType, @Param("entityIds") List<Long> entityIds);
}
