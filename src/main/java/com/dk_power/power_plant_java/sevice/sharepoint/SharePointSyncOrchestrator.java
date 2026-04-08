package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.sharepoint.SharePointSyncStatus;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
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

    private final Map<String, Long> lastSyncTimes = new ConcurrentHashMap<>();
    private final Map<String, SyncResult> lastResults = new ConcurrentHashMap<>();
    // Tracks the last successful sync completion time per entity type (for incremental fetch).
    // Persisted to file so restarts don't trigger a full 7-day fetch.
    private final Map<String, Instant> lastSuccessfulSyncAt = new ConcurrentHashMap<>();
    private static final String LAST_SYNC_FILE = "./sp-last-sync.properties";

    // Client sync exchange sets this flag to pause SharePoint sync.
    // Prevents H2 table-level lock contention between SP writes and client sync saves.
    private volatile boolean clientSyncInProgress = false;

    // Tracks in-flight SP item processing — used as a drain barrier when migration
    // needs to ensure no SP writes are mid-flight before truncating tables.
    private final java.util.concurrent.atomic.AtomicInteger activeSyncCount =
        new java.util.concurrent.atomic.AtomicInteger(0);

    public void setClientSyncInProgress(boolean inProgress) {
        this.clientSyncInProgress = inProgress;
    }

    public boolean isClientSyncInProgress() {
        return clientSyncInProgress;
    }

    /**
     * Block until all in-flight SharePoint sync operations have completed.
     * Returns false if the timeout is exceeded.
     *
     * Callers should set clientSyncInProgress=true BEFORE calling this so new
     * operations are rejected and the count can drain to zero.
     */
    public boolean waitForActiveSyncsToDrain(long timeoutMs) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (activeSyncCount.get() > 0) {
            if (System.currentTimeMillis() >= deadline) {
                log.warn("[SP Orchestrator] Drain timeout — {} active syncs still running", activeSyncCount.get());
                return false;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        log.info("[SP Orchestrator] All active syncs drained");
        return true;
    }

    public SharePointSyncOrchestrator(
            List<SharePointSyncable<?>> syncables,
            SharePointSyncSettings syncSettings,
            SyncConfig syncConfig,
            @Lazy CentralSyncService centralSyncService,
            SharePointFieldMergeService fieldMergeService) {
        this.syncables = syncables;
        this.syncSettings = syncSettings;
        this.syncConfig = syncConfig;
        this.centralSyncService = centralSyncService;
        this.fieldMergeService = fieldMergeService;
        log.info("[SP Orchestrator] Registered {} syncable entity types: {}",
            syncables.size(),
            syncables.stream().map(SharePointSyncable::getEntityTypeName)
                .collect(Collectors.joining(", ")));
        loadLastSyncTimes();
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
        if (clientSyncInProgress) {
            log.debug("sharepoint.sync.scheduler.deferred reason=client_sync_in_progress");
            return;
        }

        long start = System.currentTimeMillis();
        int dueTypes = 0;
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("sharepoint.scheduledSync")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            log.info("sharepoint.sync.scheduler.start registeredTypes={}", syncables.size());

            for (SharePointSyncable<?> syncable : syncables) {
                // Yield to client sync between entity types
                if (clientSyncInProgress) {
                    log.debug("sharepoint.sync.yielding reason=client_sync_in_progress after {} types", dueTypes);
                    break;
                }

                String type = syncable.getEntityTypeName();
                if (isSyncDue(type, syncable)) {
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
     * Rejected if a hub-wide pause is active (e.g. during migration).
     */
    public SyncResult syncEntityType(String entityTypeName) {
        if (clientSyncInProgress) {
            log.warn("[SP Orchestrator] Manual sync for {} rejected — clientSyncInProgress", entityTypeName);
            return SyncResult.error("Sync paused — try again shortly");
        }
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
     * Always uses incremental fetch ($filter=Modified gt ...).
     * On first run uses a 7-day window; subsequent runs use last successful sync time.
     */
    private <D> SyncResult executeSyncForType(SharePointSyncable<D> syncable) {
        String type = syncable.getEntityTypeName();
        SyncResult result = new SyncResult();
        long start = System.currentTimeMillis();

        Instant lastSync = lastSuccessfulSyncAt.get(type);

        // Register this sync as in-flight BEFORE re-checking the pause flag.
        // This closes the race with the drain barrier: if the flag flips between
        // the caller's check and our increment, we'll see it here and bail out
        // without the drain barrier ever missing us.
        activeSyncCount.incrementAndGet();
        if (clientSyncInProgress) {
            activeSyncCount.decrementAndGet();
            log.warn("[SP Orchestrator] {} sync aborted — clientSyncInProgress set after registration", type);
            result.setErrorMessage("Sync paused — try again shortly");
            return result;
        }
        try {
        try (LoggingContext.Scope ignored = LoggingContext.openSyncScope("sharepoint." + type, syncConfig.getMachineId())) {
            try {
                // Always use incremental fetch. On first run (no lastSync), use 7 days ago
                // as the starting point — the hub already has older data from previous syncs.
                Instant since = lastSync != null
                    ? lastSync.minusSeconds(30)   // 30s buffer for clock skew
                    : Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS);
                List<D> remoteDtos = syncable.fetchModifiedSince(since);

                if (remoteDtos == null || remoteDtos.isEmpty()) {
                    log.debug("[SP Orchestrator] No modified {} items from SharePoint", type);
                    lastSuccessfulSyncAt.put(type, Instant.now());
                    saveLastSyncTimes();
                    return result;
                }
                log.debug("[SP Orchestrator] Fetched {} {} items from SharePoint{}",
                    remoteDtos.size(), type, lastSync != null ? " (incremental)" : " (first run, 7d window)");

                // Collect SP IDs from fetched DTOs (memory only — no DB)
                Set<String> remoteIds = new HashSet<>();
                for (D dto : remoteDtos) {
                    String spId = syncable.getSharepointId(dto);
                    if (spId != null) remoteIds.add(spId.toLowerCase());
                }

                // Process all items. Each syncable's processRemoteItem opens its own
                // short transaction. Yield to client sync between items if requested.
                for (D dto : remoteDtos) {
                    if (clientSyncInProgress) {
                        log.info("[SP Orchestrator] {} yielding mid-sync for client sync ({} items remaining)",
                            type, remoteDtos.size() - remoteIds.size());
                        // Wait for client sync to finish before resuming
                        while (clientSyncInProgress) {
                            try { Thread.sleep(100); } catch (InterruptedException e) {
                                Thread.currentThread().interrupt();
                                break;
                            }
                        }
                    }

                    String spId = syncable.getSharepointId(dto);
                    try (LoggingContext.Scope entityScope =
                             LoggingContext.openEntityScope(type, null, spId)) {
                        syncable.processRemoteItem(dto, result);
                    } catch (Exception e) {
                        result.incrementFailed();
                        log.error("[SP Orchestrator] {} processRemoteItem failed for spId={}: {}",
                            type, spId, e.getMessage(), e);
                    }
                }

                // Auto-close skipped — incremental fetch doesn't have the complete remote set.
                // WR expiry (WorkRequestExpiryService) handles closing overdue WRs separately.

                syncable.afterSync(result);
                lastSuccessfulSyncAt.put(type, Instant.now());

                log.info("[SP Orchestrator] {} sync{}: created={}, updated={}, autoClosed={}, skipped={}, failed={}, fetched={}, durationMs={}",
                    type,
                    result.getCreated(), result.getUpdated(),
                    result.getAutoClosed(), result.getSkipped(), result.getFailed(),
                    remoteDtos.size(), System.currentTimeMillis() - start);
            } catch (Exception e) {
                log.error("[SP Orchestrator] {} fetch failed: {}", type, e.getMessage(), e);
                result.setErrorMessage(e.getMessage());
            }
        }

        // Dedup after sync (outside sync context — dedup saves may need tracking)
        try {
            syncable.mergeIfDuplicatesExist();
        } catch (Exception e) {
            log.error("[SP Orchestrator] {} dedup failed: {}", type, e.getMessage(), e);
        }

        return result;
        } finally {
            activeSyncCount.decrementAndGet();
        }
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

    private boolean isSyncDue(String entityType, SharePointSyncable<?> syncable) {
        long lastSync = lastSyncTimes.getOrDefault(entityType, 0L);
        return System.currentTimeMillis() - lastSync >= syncable.getSyncIntervalMs();
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

    private void loadLastSyncTimes() {
        java.io.File file = new java.io.File(LAST_SYNC_FILE);
        if (!file.exists()) return;
        try (java.io.InputStream in = new java.io.FileInputStream(file)) {
            java.util.Properties props = new java.util.Properties();
            props.load(in);
            for (String key : props.stringPropertyNames()) {
                try {
                    lastSuccessfulSyncAt.put(key, Instant.parse(props.getProperty(key)));
                } catch (Exception e) {
                    log.debug("Could not parse last sync time for {}: {}", key, e.getMessage());
                }
            }
            log.info("[SP Orchestrator] Loaded last sync times for {} entity types from {}", lastSuccessfulSyncAt.size(), LAST_SYNC_FILE);
        } catch (Exception e) {
            log.warn("[SP Orchestrator] Could not load last sync times: {}", e.getMessage());
        }
    }

    private void saveLastSyncTimes() {
        java.util.Properties props = new java.util.Properties();
        for (var entry : lastSuccessfulSyncAt.entrySet()) {
            props.setProperty(entry.getKey(), entry.getValue().toString());
        }
        try (java.io.OutputStream out = new java.io.FileOutputStream(LAST_SYNC_FILE)) {
            props.store(out, "SP orchestrator last successful sync times");
        } catch (Exception e) {
            log.debug("Could not save last sync times: {}", e.getMessage());
        }
    }
}
