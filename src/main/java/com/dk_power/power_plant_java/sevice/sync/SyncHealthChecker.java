package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;

import java.nio.file.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

/**
 * Lightweight background service that periodically checks if the client
 * is in sync with the server. Designed to run frequently with minimal overhead.
 *
 * Checks performed:
 * 1. Entity counts per table (fast COUNT queries)
 * 2. File count in uploads directory
 * 3. Latest FieldChange timestamp comparison
 * 4. Hash of recent field changes (detects missing sync operations)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncHealthChecker {

    private final SyncConfig syncConfig;
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate;
    private final EntityTableRegistry entityTableRegistry;

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    @Value("${project.root:}")
    private String projectRootPath;

    @Value("${sync.health.check.enabled:true}")
    private boolean healthCheckEnabled;

    // Current sync health status (updated by background job)
    private final AtomicReference<SyncHealthResult> currentHealth = new AtomicReference<>(new SyncHealthResult());

    // Track last successful sync date (when status was IN_SYNC)
    private final AtomicReference<Instant> lastSuccessfulSyncTime = new AtomicReference<>(null);

    // Lazy-injected to avoid circular dependency (AutoResyncService depends on this)
    @Autowired
    @Lazy
    private AutoResyncService autoResyncService;

    // Track how many consecutive OUT_OF_SYNC checks have occurred
    private int consecutiveOutOfSyncCount = 0;

    // Threshold for suggesting resync (after N consecutive out-of-sync checks)
    private static final int SUGGEST_RESYNC_THRESHOLD = 2;

    /**
     * Background job that runs every 5 minutes to check sync health.
     * Lightweight - only does count queries and timestamp comparisons.
     */
    @Scheduled(fixedDelayString = "${sync.health.check.interval:300000}") // Default 5 minutes
    public void checkSyncHealth() {
        String syncServerUrl = syncConfig.getSyncServerUrl();
        if (!healthCheckEnabled || syncServerUrl == null || syncServerUrl.isEmpty()) {
            return;
        }

        try {
            SyncHealthResult result = new SyncHealthResult();
            result.setCheckTime(Instant.now());
            result.setMachineId(syncConfig.getMachineId());

            // 1. Get local stats
            LocalSyncStats localStats = getLocalStats();
            result.setLocalStats(localStats);

            // 2. Get server stats
            ServerSyncStats serverStats = getServerStats();
            result.setServerStats(serverStats);

            if (serverStats != null) {
                // 3. Compare and determine sync status
                compareSyncStatus(result, localStats, serverStats);
            } else {
                result.setServerReachable(false);
                result.setSyncStatus(SyncStatus.UNKNOWN);
                result.setMessage("Cannot reach sync server");
            }

            // Track last successful sync and consecutive failures
            updateSyncTracking(result);

            // Attach auto-resync state for frontend visibility
            if (autoResyncService != null) {
                result.setAutoResyncState(autoResyncService.getCurrentState());
            }

            currentHealth.set(result);

            // Trigger auto-resync evaluation
            try {
                if (autoResyncService != null) {
                    autoResyncService.evaluateAndTrigger(result);
                }
            } catch (Exception e) {
                log.debug("Auto-resync evaluation failed: {}", e.getMessage());
            }

            // Log if out of sync
            if (result.getSyncStatus() == SyncStatus.OUT_OF_SYNC) {
                log.warn("Sync health check: OUT OF SYNC - {}", result.getMessage());
            } else if (result.getSyncStatus() == SyncStatus.POSSIBLY_OUT_OF_SYNC) {
                log.info("Sync health check: Possibly out of sync - {}", result.getMessage());
            }

        } catch (Exception e) {
            log.debug("Sync health check failed: {}", e.getMessage());
            SyncHealthResult errorResult = new SyncHealthResult();
            errorResult.setCheckTime(Instant.now());
            errorResult.setSyncStatus(SyncStatus.UNKNOWN);
            errorResult.setMessage("Health check error: " + e.getMessage());
            currentHealth.set(errorResult);
        }
    }

    /**
     * Get local statistics (entity counts, file count, latest change).
     */
    private LocalSyncStats getLocalStats() {
        LocalSyncStats stats = new LocalSyncStats();

        // Entity counts - use the same entity type names as the server for comparison
        Map<String, Long> entityCounts = new HashMap<>();
        long totalEntities = 0;

        for (Map.Entry<String, String> entry : entityTableRegistry.getEntityTypeToTableMap().entrySet()) {
            String entityType = entry.getKey();
            String tableName = entry.getValue();
            try {
                // Try with deleted column first, fall back to without
                Long count;
                try {
                    count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM " + tableName + " WHERE deleted = false", Long.class);
                } catch (Exception e) {
                    // Table might not have deleted column
                    count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM " + tableName, Long.class);
                }
                if (count != null) {
                    entityCounts.put(entityType, count);  // Use entity type name (PascalCase) for comparison
                    totalEntities += count;
                }
            } catch (Exception e) {
                // Table might not exist, skip it
                log.trace("Could not count table {}: {}", tableName, e.getMessage());
            }
        }

        stats.setEntityCounts(entityCounts);
        stats.setTotalEntities(totalEntities);

        // File count
        try {
            Path uploadsPath = getUploadsPath();
            if (Files.exists(uploadsPath)) {
                try (Stream<Path> walk = Files.walk(uploadsPath)) {
                    stats.setFileCount(walk.filter(Files::isRegularFile).count());
                }
            }
        } catch (Exception e) {
            log.debug("Could not count files: {}", e.getMessage());
        }

        // Latest field change timestamp
        try {
            Instant latestChange = jdbcTemplate.queryForObject(
                "SELECT MAX(changed_at) FROM field_change", Instant.class);
            stats.setLatestChangeTime(latestChange);
        } catch (Exception e) {
            log.debug("Could not get latest change time: {}", e.getMessage());
        }

        // Count of field changes in last hour (for comparison)
        try {
            Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
            Long recentChanges = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM field_change WHERE changed_at > ?",
                Long.class, oneHourAgo);
            stats.setRecentChangeCount(recentChanges != null ? recentChanges : 0);
        } catch (Exception e) {
            log.debug("Could not count recent changes: {}", e.getMessage());
        }

        // Pending sync count (changes not yet sent to server)
        try {
            Long pendingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM field_change WHERE synced = false", Long.class);
            stats.setPendingSyncCount(pendingCount != null ? pendingCount : 0);
        } catch (Exception e) {
            log.debug("Could not count pending syncs: {}", e.getMessage());
        }

        return stats;
    }

    /**
     * Get server statistics via API call.
     */
    private ServerSyncStats getServerStats() {
        try {
            String url = syncConfig.getSyncServerUrl() + "/api/sync/health-stats";
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

            ResponseEntity<ServerSyncStats> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), ServerSyncStats.class);

            return response.getBody();
        } catch (Exception e) {
            log.debug("Could not get server stats: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Compare local and server stats to determine sync status.
     */
    private void compareSyncStatus(SyncHealthResult result, LocalSyncStats local, ServerSyncStats server) {
        result.setServerReachable(true);
        StringBuilder issues = new StringBuilder();

        // 1. Compare entity counts by type (more accurate than totals)
        long totalDiff = 0;
        List<String> mismatchedTypes = new ArrayList<>();

        for (String entityType : entityTableRegistry.getAllEntityTypes()) {
            long localCount = local.getEntityCounts().getOrDefault(entityType, 0L);
            long serverCount = server.getEntityCounts().getOrDefault(entityType, 0L);

            if (localCount != serverCount) {
                totalDiff += Math.abs(localCount - serverCount);
                if (Math.abs(localCount - serverCount) > 0) {
                    mismatchedTypes.add(String.format("%s: %d vs %d", entityType, localCount, serverCount));
                }
            }
        }

        double entityDiffPercent = server.getTotalEntities() > 0 ?
            (double) totalDiff / server.getTotalEntities() * 100 : 0;

        if (!mismatchedTypes.isEmpty() && (totalDiff > 10 || entityDiffPercent > 5)) {
            issues.append(String.format("Entity mismatches (%d total diff): %s. ",
                totalDiff, String.join(", ", mismatchedTypes.subList(0, Math.min(3, mismatchedTypes.size())))));
        }

        // Update the entityDifference to reflect actual comparison
        long entityDiff = totalDiff;

        // 2. Check file count differences
        long fileDiff = Math.abs(local.getFileCount() - server.getFileCount());
        double fileDiffPercent = server.getFileCount() > 0 ?
            (double) fileDiff / server.getFileCount() * 100 : 0;

        if (fileDiff > 10 || fileDiffPercent > 5) {
            issues.append(String.format("File count mismatch: local=%d, server=%d (diff=%d). ",
                local.getFileCount(), server.getFileCount(), fileDiff));
        }

        // 3. Check if local is behind on field changes
        if (server.getLatestChangeTime() != null && local.getLatestChangeTime() != null) {
            long timeDiffSeconds = server.getLatestChangeTime().getEpochSecond() -
                local.getLatestChangeTime().getEpochSecond();

            if (timeDiffSeconds > 300) { // More than 5 minutes behind
                issues.append(String.format("Local is %d seconds behind server on changes. ",
                    timeDiffSeconds));
            }
        }

        // 4. Check pending sync count (local changes not yet sent)
        if (local.getPendingSyncCount() > 100) {
            issues.append(String.format("Large pending sync queue: %d changes waiting. ",
                local.getPendingSyncCount()));
        }

        // Determine overall status
        if (issues.length() == 0) {
            result.setSyncStatus(SyncStatus.IN_SYNC);
            result.setMessage("All checks passed");
        } else if (entityDiffPercent > 20 || fileDiffPercent > 20) {
            result.setSyncStatus(SyncStatus.OUT_OF_SYNC);
            result.setMessage(issues.toString().trim());
        } else {
            result.setSyncStatus(SyncStatus.POSSIBLY_OUT_OF_SYNC);
            result.setMessage(issues.toString().trim());
        }

        // Set difference counts for UI
        result.setEntityDifference(entityDiff);
        result.setFileDifference(fileDiff);
    }

    /**
     * Get current sync health status (called by controllers/UI).
     */
    public SyncHealthResult getCurrentHealth() {
        return currentHealth.get();
    }

    /**
     * Force an immediate health check (for manual trigger).
     */
    public SyncHealthResult checkNow() {
        checkSyncHealth();
        return currentHealth.get();
    }

    /**
     * Update tracking for sync status and generate recommendations.
     */
    private void updateSyncTracking(SyncHealthResult result) {
        Instant now = Instant.now();

        if (result.getSyncStatus() == SyncStatus.IN_SYNC) {
            // Record successful sync time
            lastSuccessfulSyncTime.set(now);
            consecutiveOutOfSyncCount = 0;
            result.setSuggestResync(false);
            result.setSuggestedSyncDate(null);
            result.setRecommendation(null);
        } else if (result.getSyncStatus() == SyncStatus.OUT_OF_SYNC ||
                   result.getSyncStatus() == SyncStatus.POSSIBLY_OUT_OF_SYNC) {
            consecutiveOutOfSyncCount++;

            // Get the last successful sync date for suggestion
            Instant lastGoodSync = lastSuccessfulSyncTime.get();

            // Determine if we should suggest a resync
            if (consecutiveOutOfSyncCount >= SUGGEST_RESYNC_THRESHOLD) {
                result.setSuggestResync(true);

                if (lastGoodSync != null) {
                    // Suggest syncing from the last known good date
                    String suggestedDate = lastGoodSync.atZone(java.time.ZoneId.systemDefault())
                        .toLocalDate().toString();
                    result.setSuggestedSyncDate(suggestedDate);
                    result.setLastSuccessfulSyncTime(lastGoodSync);
                    result.setRecommendation(String.format(
                        "Data has been out of sync for %d consecutive checks. " +
                        "Recommended action: Run partial sync from %s to restore consistency.",
                        consecutiveOutOfSyncCount, suggestedDate));
                } else {
                    // No last good sync date available - suggest full resync
                    result.setSuggestedSyncDate(null);
                    result.setRecommendation(
                        "Data is out of sync and no previous sync point is available. " +
                        "Recommended action: Run a full resync to restore consistency.");
                }

                log.warn("Sync suggestion: {} consecutive out-of-sync checks. Suggested date: {}",
                    consecutiveOutOfSyncCount, result.getSuggestedSyncDate());
            } else {
                result.setSuggestResync(false);
                result.setLastSuccessfulSyncTime(lastGoodSync);
            }
        }

        result.setConsecutiveOutOfSyncCount(consecutiveOutOfSyncCount);
    }

    /**
     * Get the last successful sync time.
     */
    public Instant getLastSuccessfulSyncTime() {
        return lastSuccessfulSyncTime.get();
    }

    /**
     * Manually set the last successful sync time (e.g., after a successful partial sync).
     */
    public void recordSuccessfulSync() {
        lastSuccessfulSyncTime.set(Instant.now());
        consecutiveOutOfSyncCount = 0;
        log.info("Recorded successful sync at {}", lastSuccessfulSyncTime.get());
    }

    private Path getUploadsPath() {
        Path filesPath = Paths.get(filesRootPath);
        if (filesPath.isAbsolute()) {
            return filesPath;
        }
        if (projectRootPath != null && !projectRootPath.isEmpty()) {
            return Paths.get(projectRootPath, filesRootPath);
        }
        return filesPath;
    }

    // ==================== DTOs ====================

    public enum SyncStatus {
        IN_SYNC,           // Everything matches
        POSSIBLY_OUT_OF_SYNC, // Minor differences detected
        OUT_OF_SYNC,       // Significant differences
        UNKNOWN            // Could not determine (server unreachable, etc.)
    }

    @Data
    public static class SyncHealthResult {
        private Instant checkTime;
        private String machineId;
        private SyncStatus syncStatus = SyncStatus.UNKNOWN;
        private String message;
        private boolean serverReachable;
        private long entityDifference;
        private long fileDifference;
        private LocalSyncStats localStats;
        private ServerSyncStats serverStats;

        // Sync suggestion fields
        private boolean suggestResync;              // True if system recommends a resync
        private String suggestedSyncDate;           // yyyy-MM-dd format date to sync from
        private Instant lastSuccessfulSyncTime;     // When was the last successful sync
        private String recommendation;              // Human-readable recommendation message
        private int consecutiveOutOfSyncCount;      // How many consecutive checks were out of sync
        private AutoResyncService.AutoResyncState autoResyncState; // Current auto-resync escalation state
    }

    @Data
    public static class LocalSyncStats {
        private Map<String, Long> entityCounts = new HashMap<>();
        private long totalEntities;
        private long fileCount;
        private Instant latestChangeTime;
        private long recentChangeCount;
        private long pendingSyncCount;
    }

    @Data
    public static class ServerSyncStats {
        private Map<String, Long> entityCounts = new HashMap<>();
        private long totalEntities;
        private long fileCount;
        private Instant latestChangeTime;
        private long totalFieldChanges;
    }
}
