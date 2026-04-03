package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Contract for any entity type that syncs with a SharePoint list.
 * Each implementation handles: field mapping, entity persistence,
 * and merge (dedup) for ONE entity type.
 * <p>
 * To add a new SP-backed entity, implement this interface as a @Component
 * and the SharePointSyncOrchestrator will auto-discover it.
 *
 * @param <D> the DTO type used to transfer data from SharePoint
 */
public interface SharePointSyncable<D> {

    /** Unique key identifying this entity type (e.g., "WorkRequest", "Jha"). */
    String getEntityTypeName();

    /** The SharePoint list title (e.g., "Work Requests", "JHA"). */
    String getSharePointListTitle();

    /** Fetch all items from SharePoint, mapped to DTOs. */
    List<D> fetchAllFromSharePoint();

    /**
     * Fetch only items modified since the given timestamp.
     * Default: falls back to fetchAllFromSharePoint() (no incremental support).
     * Override to use SP $filter for fast "any news?" checks.
     */
    default List<D> fetchModifiedSince(Instant since) {
        return fetchAllFromSharePoint();
    }

    /**
     * Process a single remote DTO: create or update the local entity.
     * Implementations should use SharePointFieldMergeService for field-level LWW.
     */
    EntitySyncOutcome processRemoteItem(D remoteDto, SyncResult result);

    /** Extract the sharepointId from a DTO. */
    String getSharepointId(D dto);

    /**
     * Per-type sync interval in milliseconds.
     * Override for entity types that need more frequent polling (e.g., WorkRequest, JHA).
     * Default: 5 minutes. The orchestrator checks this per entity type.
     */
    default long getSyncIntervalMs() { return 300_000; } // 5 minutes

    /** Whether this entity type supports auto-close (e.g., WR does, JHA does not). */
    boolean supportsAutoClose();

    /**
     * Auto-close local "Active" records not present in the remote set.
     * Only called if supportsAutoClose() returns true.
     */
    void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result);

    /** Run dedup merge for this entity type. */
    void mergeIfDuplicatesExist();

    /** Post-sync hook (e.g., JHA links to WorkRequest). Default: no-op. */
    default void afterSync(SyncResult result) {}

    // --- Field-level merge support ---

    /**
     * Map of entity field name to SP column name.
     * Used for field-level sync to know which entity field corresponds to which SP column.
     * Example: {"workScope" -> "Title", "dateOfWorkToBePerformed" -> "DateOfWork"}
     */
    Map<String, String> getFieldMapping();

    /**
     * Extract SP column values from DTO as a string map for snapshot comparison.
     * Keys are SP column names (matching values in getFieldMapping()).
     */
    Map<String, String> extractSpFieldValues(D dto);

    /** Get the SP Modified datetime from a DTO (used as SP-side timestamp for LWW). */
    Instant getSpModifiedTime(D dto);

    /**
     * Apply only specific fields from DTO to an existing entity.
     * @param entity the local entity to update
     * @param dto the SP DTO containing new values
     * @param entityFieldNames set of entity field names to apply (keys from getFieldMapping())
     */
    void applySelectiveFields(Object entity, D dto, Set<String> entityFieldNames);

    /** Find the local entity ID for a given sharepointId (for FieldChange lookup). */
    Long findLocalEntityId(String sharepointId);

    enum EntitySyncOutcome { CREATED, UPDATED, SKIPPED, FAILED }
}
