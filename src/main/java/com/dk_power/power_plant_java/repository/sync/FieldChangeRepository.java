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
    // Uses delimited format |MACHINE_ID| to prevent substring matching (e.g., MACHINE_1 vs MACHINE_10)
    @Query("SELECT fc FROM FieldChange fc WHERE (fc.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%') OR fc.syncedToMachines IS NULL) ORDER BY fc.timestamp ASC")
    List<FieldChange> findChangesNotSyncedTo(@Param("machineId") String machineId);

    // PAGINATED: Get changes not yet synced to a specific machine
    // Uses delimited format |MACHINE_ID| to prevent substring matching
    // TOTAL order (timestamp, originMachineId, id): ordering by timestamp ALONE makes page boundaries
    // unstable when many changes share a timestamp — a row can be skipped or repeated across pages. The
    // tiebreak matches SyncOrder so pagination is stable and deterministic.
    @Query("SELECT fc FROM FieldChange fc WHERE (fc.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%') OR fc.syncedToMachines IS NULL) ORDER BY fc.timestamp ASC, fc.originMachineId ASC, fc.id ASC")
    Page<FieldChange> findChangesNotSyncedTo(@Param("machineId") String machineId, Pageable pageable);

    // PAGINATED: Get changes not yet synced to a machine, excluding changes that originated FROM that machine.
    // Used by hub when serving changes to a client — prevents sending a client's own changes back to it.
    // Total order for stable pagination (see above).
    @Query("SELECT fc FROM FieldChange fc WHERE (fc.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%') OR fc.syncedToMachines IS NULL) AND fc.originMachineId != :machineId ORDER BY fc.timestamp ASC, fc.originMachineId ASC, fc.id ASC")
    Page<FieldChange> findChangesNotSyncedToExcludingOrigin(@Param("machineId") String machineId, Pageable pageable);

    // COUNT: Pending changes for a machine, excluding its own changes (hub use)
    @Query("SELECT COUNT(fc) FROM FieldChange fc WHERE (fc.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%') OR fc.syncedToMachines IS NULL) AND fc.originMachineId != :machineId")
    long countPendingChangesForExcludingOrigin(@Param("machineId") String machineId);

    // DIAGNOSTIC: the GENUINE deliverable backlog for a machine — distinct (entityType, entityId, fieldName)
    // among pending rows, EXCLUDING the synthetic _entity_ CREATE/DELETE markers. The raw pending COUNT
    // over-states this because it also counts one _entity_ marker per entity lifecycle event plus any
    // not-yet-compacted history rows. Native subquery avoids JPQL COUNT(DISTINCT concat) type-coercion.
    @Query(value = "SELECT COUNT(*) FROM (SELECT DISTINCT ENTITY_TYPE, ENTITY_ID, FIELD_NAME FROM FIELD_CHANGE "
            + "WHERE (SYNCED_TO_MACHINES NOT LIKE CONCAT('%|', :machineId, '|%') OR SYNCED_TO_MACHINES IS NULL) "
            + "AND ORIGIN_MACHINE_ID <> :machineId AND FIELD_NAME <> '_entity_') distinct_fields", nativeQuery = true)
    long countDistinctPendingFieldsFor(@Param("machineId") String machineId);

    // DIAGNOSTIC: pending rows grouped by (entityType, fieldName), busiest first — pass a Pageable to cap
    // to the top N. A single (entityType, fieldName) dominating with millions is the dead-letter-pin
    // signature (e.g. a high-churn field on a soft-deleted/absent entity whose latest never applies).
    @Query("SELECT fc.entityType, fc.fieldName, COUNT(fc) FROM FieldChange fc "
            + "WHERE (fc.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%') OR fc.syncedToMachines IS NULL) "
            + "AND fc.originMachineId <> :machineId "
            + "GROUP BY fc.entityType, fc.fieldName ORDER BY COUNT(fc) DESC")
    List<Object[]> pendingBreakdownByField(@Param("machineId") String machineId, Pageable pageable);

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
    // Uses delimited format |MACHINE_ID| to prevent substring matching
    @Query("SELECT COUNT(fc) FROM FieldChange fc WHERE (fc.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%') OR fc.syncedToMachines IS NULL)")
    long countPendingChangesFor(@Param("machineId") String machineId);

    // Count total changes
    long count();

    // Cleanup old changes (retention policy)
    @Modifying
    @Query("DELETE FROM FieldChange fc WHERE fc.timestamp < :before")
    int deleteChangesBefore(@Param("before") Instant before);

    // Mark a machine's OWN changes as synced back to itself (hub cleanup — prevents sending changes back to origin)
    @Modifying
    @Query(value = "UPDATE FIELD_CHANGE SET SYNCED_TO_MACHINES = CONCAT(COALESCE(SYNCED_TO_MACHINES, ''), CONCAT('|', :machineId, '|')) " +
           "WHERE ORIGIN_MACHINE_ID = :machineId AND (SYNCED_TO_MACHINES NOT LIKE CONCAT('%|', :machineId, '|%') OR SYNCED_TO_MACHINES IS NULL)", nativeQuery = true)
    int markOwnChangesSyncedTo(@Param("machineId") String machineId);

    // Mark ALL existing changes as synced to a machine (used after bulk import — the client already has all data)
    @Modifying
    @Query(value = "UPDATE FIELD_CHANGE SET SYNCED_TO_MACHINES = CONCAT(COALESCE(SYNCED_TO_MACHINES, ''), CONCAT('|', :machineId, '|')) " +
           "WHERE SYNCED_TO_MACHINES NOT LIKE CONCAT('%|', :machineId, '|%') OR SYNCED_TO_MACHINES IS NULL", nativeQuery = true)
    int markAllChangesSyncedTo(@Param("machineId") String machineId);

    // BOUNDED mark-synced: mark synced to a machine ONLY the changes the hub had RECEIVED at/under a
    // snapshot-time cutoff. Used after a wholesale DB-snapshot restore — the client has everything IN the
    // snapshot, but changes the hub committed AFTER the snapshot MUST stay pending so normal incremental pull
    // still delivers them (the unbounded markAllChangesSyncedTo would silently drop that window).
    //
    // Filter on receivedAt, NOT timestamp. receivedAt is the HUB's local receipt/creation time (single clock
    // — set to hub-now when a client's change is stored, HubSyncService, and at construction for hub-own
    // changes), so it tracks snapshot/commit visibility. timestamp is the ORIGIN's logical clock, preserved
    // verbatim: an offline client's backlog carries an OLD timestamp yet arrives at the hub AFTER the snapshot
    // — filtering on timestamp would mark it synced though it isn't in the snapshot = silent loss. A row with
    // null receivedAt (legacy) simply isn't matched → stays pending → safe. JPQL avoids column-quoting the
    // reserved word `timestamp`.
    @Modifying
    @Query("UPDATE FieldChange fc SET fc.syncedToMachines = CONCAT(COALESCE(fc.syncedToMachines, ''), CONCAT('|', :machineId, '|')) "
            + "WHERE (fc.syncedToMachines NOT LIKE CONCAT('%|', :machineId, '|%') OR fc.syncedToMachines IS NULL) "
            + "AND fc.receivedAt <= :cutoff")
    int markChangesSyncedToUpTo(@Param("machineId") String machineId, @Param("cutoff") Instant cutoff);

    // Remove a machine from syncedToMachines on all changes (used by reset endpoint)
    @Modifying
    @Query(value = "UPDATE FIELD_CHANGE SET SYNCED_TO_MACHINES = REPLACE(SYNCED_TO_MACHINES, CONCAT('|', :machineId, '|'), '|') " +
           "WHERE SYNCED_TO_MACHINES LIKE CONCAT('%|', :machineId, '|%')", nativeQuery = true)
    int removeMachineFromSynced(@Param("machineId") String machineId);

    // Get distinct origin machine IDs (for admin monitoring)
    @Query("SELECT DISTINCT fc.originMachineId FROM FieldChange fc")
    List<String> findDistinctOriginMachineIds();

    // Get distinct synced machine IDs (for admin monitoring — extracts from pipe-delimited string)
    // Note: this is a simple approach; for full extraction, use the service layer
    @Query("SELECT COUNT(fc) FROM FieldChange fc")
    long countTotal();

    // Count changes by entity type
    @Query("SELECT fc.entityType, COUNT(fc) FROM FieldChange fc GROUP BY fc.entityType ORDER BY COUNT(fc) DESC")
    List<Object[]> countByEntityType();

    // Delete all FieldChanges
    @Modifying
    @Query("DELETE FROM FieldChange fc")
    int deleteAllChanges();

    // Check if change already exists (for deduplication)
    boolean existsByEntityTypeAndEntityIdAndFieldNameAndTimestampAndOriginMachineId(
        String entityType, Long entityId, String fieldName, Instant timestamp, String originMachineId);

    // Check whether an entity has a CREATE marker in sync history.
    boolean existsByEntityTypeAndEntityIdAndChangeTypeAndFieldName(
        String entityType, Long entityId, FieldChange.ChangeType changeType, String fieldName);

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

    // ===== Log compaction (keep only the latest FieldChange per entityType:entityId:fieldName) =====
    // Candidate keys = a field with MORE THAN ONE stored change (so there is something to compact).
    // Excludes the _entity_ CREATE/DELETE markers — those are handled separately (tombstone logic) and
    // must never be collapsed by field compaction (dropping a CREATE strands a live entity's rows).
    @Query("SELECT fc.entityType, fc.entityId, fc.fieldName FROM FieldChange fc "
            + "WHERE fc.fieldName <> '_entity_' "
            + "GROUP BY fc.entityType, fc.entityId, fc.fieldName HAVING COUNT(fc.id) > 1")
    List<Object[]> findCompactionCandidateKeys(Pageable pageable);

    // All stored changes for one (entityType, entityId, fieldName) key — the compactor picks the
    // SyncOrder max to keep and deletes the rest.
    @Query("SELECT fc FROM FieldChange fc WHERE fc.entityType = :et AND fc.entityId = :eid AND fc.fieldName = :fn")
    List<FieldChange> findAllForKey(@Param("et") String entityType, @Param("eid") Long entityId,
                                    @Param("fn") String fieldName);

    // Delete the EXACT superseded rows the compactor identified (never a predicate over the live table),
    // so a change inserted concurrently — which was never in the id list — can never be deleted.
    @Modifying
    @Query("DELETE FROM FieldChange fc WHERE fc.id IN :ids")
    int deleteByIdIn(@Param("ids") java.util.Collection<UUID> ids);

    // BATCH id-existence: which of these change ids are already stored. Used to dedup re-delivered
    // changes now that a change keeps ONE global id for its whole life (Inc 4). This replaced the old
    // key-based gate (CONCAT of entityType:entityId:fieldName:timestamp:originMachineId), which was a
    // dead no-op — the SQL rendered the timestamp as '2026-... 12:34:56+00' while the Java side compared
    // against Instant.toString() '2026-...T12:34:56Z', so its keys never matched.
    @Query("SELECT fc.id FROM FieldChange fc WHERE fc.id IN :ids")
    java.util.Set<UUID> findExistingIds(@Param("ids") java.util.Collection<UUID> ids);

    // Get recent incoming changes (from other machines) for hub entity retry
    @Query("SELECT fc FROM FieldChange fc WHERE fc.originMachineId != :hubMachineId " +
           "AND fc.receivedAt >= :since ORDER BY fc.receivedAt ASC")
    List<FieldChange> findRecentIncomingChanges(@Param("hubMachineId") String hubMachineId,
                                                 @Param("since") Instant since);
}
