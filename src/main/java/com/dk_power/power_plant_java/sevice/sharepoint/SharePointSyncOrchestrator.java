package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.sharepoint.SharePointSyncStatus;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import com.dk_power.power_plant_java.sevice.sync.SyncContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Central orchestrator for all SharePoint-backed entity sync.
 * Replaces per-entity @Scheduled methods with a single scheduler
 * that iterates over all registered SharePointSyncable beans.
 */
@Slf4j
@Service
public class SharePointSyncOrchestrator {

    private final List<SharePointSyncable<?>> syncables;
    private final SharePointSyncSettings syncSettings;
    private final SyncConfig syncConfig;
    private final CentralSyncService centralSyncService;
    private final SharePointFieldMergeService fieldMergeService;
    private final SyncContext syncContext;

    private final Map<String, Long> lastSyncTimes = new ConcurrentHashMap<>();
    private final Map<String, SyncResult> lastResults = new ConcurrentHashMap<>();

    public SharePointSyncOrchestrator(
            List<SharePointSyncable<?>> syncables,
            SharePointSyncSettings syncSettings,
            SyncConfig syncConfig,
            @Lazy CentralSyncService centralSyncService,
            SharePointFieldMergeService fieldMergeService,
            SyncContext syncContext) {
        this.syncables = syncables;
        this.syncSettings = syncSettings;
        this.syncConfig = syncConfig;
        this.centralSyncService = centralSyncService;
        this.fieldMergeService = fieldMergeService;
        this.syncContext = syncContext;
        log.info("[SP Orchestrator] Registered {} syncable entity types: {}",
            syncables.size(),
            syncables.stream().map(SharePointSyncable::getEntityTypeName)
                .collect(Collectors.joining(", ")));
    }

    /**
     * Single scheduled entry point. Polls every 30s, checks per-entity-type
     * intervals, syncs what is due.
     * Only the hub does scheduled SP polling. Clients sync manually per page
     * via POST /api/sharepoint-sync/sync/{entityType}.
     */
    @Scheduled(fixedDelay = 30000, initialDelay = 30000)
    public void scheduledSync() {
        if (!syncConfig.isHubMode()) return;
        if (!syncSettings.isEnabled()) return;

        long start = System.currentTimeMillis();
        int dueTypes = 0;
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("sharepoint.scheduledSync")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            log.info("sharepoint.sync.scheduler.start registeredTypes={}", syncables.size());

            for (SharePointSyncable<?> syncable : syncables) {
                String type = syncable.getEntityTypeName();
                if (isSyncDue(type)) {
                    dueTypes++;
                    markSynced(type);
                    try {
                        SyncResult result = executeSyncForType(syncable);
                        lastResults.put(type, result);
                    } catch (Exception e) {
                        log.error("[SP Orchestrator] {} sync failed: {}", type, e.getMessage(), e);
                    }
                }
            }

            log.info("sharepoint.sync.scheduler.complete dueTypes={} durationMs={}",
                dueTypes, System.currentTimeMillis() - start);
        }
    }

    /**
     * Manual sync for a specific entity type. Bypasses interval check.
     */
    public SyncResult syncEntityType(String entityTypeName) {
        SharePointSyncable<?> syncable = findSyncable(entityTypeName);
        if (syncable == null) {
            return SyncResult.error("Unknown entity type: " + entityTypeName);
        }
        SyncResult result = executeSyncForType(syncable);
        lastResults.put(entityTypeName, result);
        markSynced(entityTypeName);
        return result;
    }

    /**
     * Core sync logic for one entity type.
     */
    private <D> SyncResult executeSyncForType(SharePointSyncable<D> syncable) {
        String type = syncable.getEntityTypeName();
        SyncResult result = new SyncResult();
        long start = System.currentTimeMillis();

        // Wrap in SyncContext so FieldChangeEntityListener doesn't create
        // false FieldChange records during SP sync saves
        try (LoggingContext.Scope ignored = LoggingContext.openSyncScope("sharepoint." + type, syncConfig.getMachineId())) {
            syncContext.startSync();
            try {
                List<D> remoteDtos = syncable.fetchAllFromSharePoint();
                if (remoteDtos == null || remoteDtos.isEmpty()) {
                    log.debug("[SP Orchestrator] No {} items from SharePoint", type);
                    return result;
                }
                log.debug("[SP Orchestrator] Fetched {} {} items from SharePoint", remoteDtos.size(), type);

                Set<String> remoteIds = new HashSet<>();
                for (D dto : remoteDtos) {
                    String spId = syncable.getSharepointId(dto);
                    if (spId != null) remoteIds.add(spId.toLowerCase());
                    try (LoggingContext.Scope entityScope =
                             LoggingContext.openEntityScope(type, null, spId)) {
                        syncable.processRemoteItem(dto, result);
                    } catch (Exception e) {
                        result.incrementFailed();
                        log.error("[SP Orchestrator] {} processRemoteItem failed for spId={}: {}",
                            type, spId, e.getMessage(), e);
                    }
                }

                if (syncable.supportsAutoClose()) {
                    syncable.autoCloseAbsentRecords(remoteIds, result);
                }

                syncable.afterSync(result);

                log.info("[SP Orchestrator] {} sync: created={}, updated={}, autoClosed={}, skipped={}, failed={}, durationMs={}",
                    type, result.getCreated(), result.getUpdated(),
                    result.getAutoClosed(), result.getSkipped(), result.getFailed(),
                    System.currentTimeMillis() - start);
            } catch (Exception e) {
                log.error("[SP Orchestrator] {} fetch failed: {}", type, e.getMessage(), e);
                result.setErrorMessage(e.getMessage());
            } finally {
                syncContext.endSync();
            }
        }

        // Dedup after sync (outside sync context — dedup saves may need tracking)
        try {
            syncable.mergeIfDuplicatesExist();
        } catch (Exception e) {
            log.error("[SP Orchestrator] {} dedup failed: {}", type, e.getMessage(), e);
        }

        return result;
    }

    /** Get sync status for all entity types. */
    public List<SharePointSyncStatus> getAllSyncStatuses() {
        boolean hubOnline = syncConfig.isHubMode() || centralSyncService.isServerAvailable();
        return syncables.stream().map(s -> buildStatus(s, hubOnline))
            .collect(Collectors.toList());
    }

    /** Get sync status for one entity type. */
    public SharePointSyncStatus getSyncStatus(String entityTypeName) {
        SharePointSyncable<?> syncable = findSyncable(entityTypeName);
        if (syncable == null) return null;
        boolean hubOnline = syncConfig.isHubMode() || centralSyncService.isServerAvailable();
        return buildStatus(syncable, hubOnline);
    }

    /** Get list of registered entity type names. */
    public List<String> getRegisteredEntityTypes() {
        return syncables.stream()
            .map(SharePointSyncable::getEntityTypeName)
            .collect(Collectors.toList());
    }

    /**
     * Clear all stored snapshots, forcing next sync to re-evaluate all fields.
     * Use this to recover from stale snapshot state (e.g. after fixing sync bugs).
     */
    public void clearAllSnapshots() {
        fieldMergeService.clearAllSnapshots();
        log.info("[SP Orchestrator] Cleared all SharePoint snapshots — next sync will re-evaluate all fields");
    }

    // --- Internal helpers ---

    private SharePointSyncStatus buildStatus(SharePointSyncable<?> syncable, boolean hubOnline) {
        String type = syncable.getEntityTypeName();
        long lastSync = lastSyncTimes.getOrDefault(type, 0L);
        boolean stale = !hubOnline
            && (lastSync == 0 || System.currentTimeMillis() - lastSync > syncSettings.getIntervalMs() * 3);
        return new SharePointSyncStatus(
            type, lastSync, formatTimeAgo(lastSync),
            syncSettings.isEnabled(), hubOnline, stale,
            lastResults.get(type));
    }

    private boolean isSyncDue(String entityType) {
        long lastSync = lastSyncTimes.getOrDefault(entityType, 0L);
        return System.currentTimeMillis() - lastSync >= syncSettings.getIntervalMs();
    }

    private void markSynced(String entityType) {
        lastSyncTimes.put(entityType, System.currentTimeMillis());
    }

    private SharePointSyncable<?> findSyncable(String entityTypeName) {
        return syncables.stream()
            .filter(s -> s.getEntityTypeName().equalsIgnoreCase(entityTypeName))
            .findFirst().orElse(null);
    }

    private String formatTimeAgo(long epochMs) {
        if (epochMs == 0) return "Never";
        long seconds = (System.currentTimeMillis() - epochMs) / 1000;
        if (seconds < 60) return seconds + "s ago";
        if (seconds < 3600) return (seconds / 60) + "m ago";
        return (seconds / 3600) + "h ago";
    }
}
