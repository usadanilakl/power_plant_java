package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
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
    private final SharePointSyncSettings syncIntervals;
    private final FieldChangeRepository fieldChangeRepository;

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

    // Startup time — suppress resync recommendations during initial sync
    private final Instant startupTime = Instant.now();
    private static final long STARTUP_GRACE_MINUTES = 5;

    // Lazy-injected to avoid circular dependency (AutoResyncService depends on this)
    @Autowired
    @Lazy
    private AutoResyncService autoResyncService;

    // Track how many consecutive OUT_OF_SYNC checks have occurred
    private int consecutiveOutOfSyncCount = 0;

    // Threshold for suggesting resync (after N consecutive out-of-sync checks)
    private static final int SUGGEST_RESYNC_THRESHOLD = 5;
    private static final long ACTIVE_SYNC_GRACE_SECONDS = 300;
    private static final long STALE_BACKLOG_SECONDS = 900;

    /**
     * Scheduled wrapper: polls every 30s, only runs when the configured health-check interval has elapsed.
     */
    @Scheduled(fixedDelay = 30000, initialDelay = 60000)
    public void scheduledHealthCheck() {
        if (!healthCheckEnabled || !syncIntervals.isHealthCheckDue()) return;
        syncIntervals.markHealthChecked();
        checkSyncHealth();
    }

    /**
     * Performs the actual sync health check.
     * Called by scheduler wrapper and also directly from checkNow().
     */
    public void checkSyncHealth() {
        String syncServerUrl = syncConfig.getSyncServerUrl();
        if (!healthCheckEnabled || syncServerUrl == null || syncServerUrl.isEmpty()) {
            return;
        }

        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("sync.healthCheck")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
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

            log.info("sync.health.complete status={} serverReachable={} durationMs={}",
                result.getSyncStatus(), result.isServerReachable(), System.currentTimeMillis() - start);

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

        // File count and total size
        try {
            Path uploadsPath = getUploadsPath();
            if (Files.exists(uploadsPath)) {
                long[] countAndSize = {0, 0}; // [count, totalBytes]
                try (Stream<Path> walk = Files.walk(uploadsPath)) {
                    walk.filter(Files::isRegularFile).forEach(p -> {
                        countAndSize[0]++;
                        try { countAndSize[1] += Files.size(p); } catch (Exception ignored) {}
                    });
                }
                stats.setFileCount(countAndSize[0]);
                stats.setTotalFileBytes(countAndSize[1]);
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

        // Pending sync count using the same semantics as the actual outbound queue.
        try {
            stats.setPendingSyncCount(fieldChangeRepository.countPendingChangesFor("SERVER"));
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
            ServerSyncStats stats = response.getBody();
            if (stats == null) {
                return null;
            }

            try {
                String pendingUrl = syncConfig.getSyncServerUrl() + "/api/sync/changes/count";
                ResponseEntity<Map<String, Long>> pendingResponse = restTemplate.exchange(
                    pendingUrl, HttpMethod.GET, new HttpEntity<>(headers),
                    new org.springframework.core.ParameterizedTypeReference<>() {});
                Map<String, Long> pendingBody = pendingResponse.getBody();
                if (pendingBody != null) {
                    stats.setPendingChangesForClient(pendingBody.getOrDefault("count", 0L));
                }
            } catch (Exception e) {
                log.debug("Could not get server pending change count: {}", e.getMessage());
            }

            return stats;
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
        long localPending = local.getPendingSyncCount();
        long serverPending = Math.max(server.getPendingChangesForClient(), 0);
        result.setServerPendingChangesForClient(serverPending);
        result.setBacklogDetected(localPending > 0 || serverPending > 0);
        result.setEntityDrift(buildEntityDrift(local, server));
        result.setFileDrift(new FileDrift(local.getFileCount(), server.getFileCount(), Math.abs(local.getFileCount() - server.getFileCount())));

        // 1. Compare entity counts by type — only compare types reported by BOTH sides
        //    (server may not track all local entity types, e.g. Role, Jha, JobLog, etc.)
        long totalDiff = 0;
        for (EntityDrift drift : result.getEntityDrift()) {
            if (drift.getDifference() > 0) {
                totalDiff += drift.getDifference();
            }
        }

        double entityDiffPercent = server.getTotalEntities() > 0 ?
            (double) totalDiff / server.getTotalEntities() * 100 : 0;

        // Update the entityDifference to reflect actual comparison
        long entityDiff = totalDiff;

        // 2. Check file count differences
        long fileDiff = Math.abs(local.getFileCount() - server.getFileCount());
        double fileDiffPercent = server.getFileCount() > 0 ?
            (double) fileDiff / server.getFileCount() * 100 : 0;

        if (result.isBacklogDetected()) {
            if (localPending > 0) {
                issues.append(String.format("local pending=%d", localPending));
            }
            if (serverPending > 0) {
                if (issues.length() > 0) issues.append(", ");
                issues.append(String.format("server pending for this client=%d", serverPending));
            }

            Instant latestRelevantActivity = Stream.of(
                    localPending > 0 ? local.getLatestChangeTime() : null,
                    serverPending > 0 ? server.getLatestChangeTime() : null)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);

            boolean activeBacklog = latestRelevantActivity != null &&
                latestRelevantActivity.isAfter(Instant.now().minusSeconds(ACTIVE_SYNC_GRACE_SECONDS));
            boolean staleBacklog = latestRelevantActivity == null ||
                latestRelevantActivity.isBefore(Instant.now().minusSeconds(STALE_BACKLOG_SECONDS));

            if (activeBacklog) {
                result.setSyncStatus(SyncStatus.POSSIBLY_OUT_OF_SYNC);
                result.setMessage("Sync is catching up: " + issues);
            } else if (staleBacklog || localPending > 100 || serverPending > 100) {
                result.setSyncStatus(SyncStatus.OUT_OF_SYNC);
                result.setMessage("Sync backlog has not cleared: " + issues);
            } else {
                result.setSyncStatus(SyncStatus.POSSIBLY_OUT_OF_SYNC);
                result.setMessage("Sync backlog detected: " + issues);
            }

            if (entityDiff > 0 || fileDiff > 0) {
                result.setMessage(result.getMessage() + String.format(
                    ". Secondary drift: entities diff=%d, files diff=%d", entityDiff, fileDiff));
            }

            result.setEntityDifference(entityDiff);
            result.setFileDifference(fileDiff);
            return;
        }

        if (entityDiff == 0 && fileDiff == 0) {
            result.setSyncStatus(SyncStatus.IN_SYNC);
            result.setMessage("No pending backlog and counts match");
        } else {
            if (entityDiff > 0) {
                issues.append(String.format("Entity count drift=%d", entityDiff));
            }
            if (fileDiff > 0) {
                if (issues.length() > 0) issues.append(". ");
                issues.append(String.format("File count drift=%d", fileDiff));
            }

            if (entityDiffPercent > 20 || fileDiffPercent > 20) {
                result.setSyncStatus(SyncStatus.OUT_OF_SYNC);
            } else {
                result.setSyncStatus(SyncStatus.POSSIBLY_OUT_OF_SYNC);
            }
            result.setMessage("No pending backlog, but counts still differ: " + issues);
        }

        if (result.getSyncStatus() == SyncStatus.POSSIBLY_OUT_OF_SYNC &&
            entityDiff <= 10 && fileDiff <= 10) {
            result.setSyncStatus(SyncStatus.IN_SYNC);
            result.setMessage("Counts are close and no sync backlog is present");
        }

        // Set difference counts for UI
        result.setEntityDifference(entityDiff);
        result.setFileDifference(fileDiff);
    }

    private List<EntityDrift> buildEntityDrift(LocalSyncStats local, ServerSyncStats server) {
        Set<String> comparableTypes = new TreeSet<>(entityTableRegistry.getAllEntityTypes());
        comparableTypes.retainAll(server.getEntityCounts().keySet());

        List<EntityDrift> drift = new ArrayList<>();
        for (String entityType : comparableTypes) {
            long localCount = local.getEntityCounts().getOrDefault(entityType, 0L);
            long serverCount = server.getEntityCounts().getOrDefault(entityType, 0L);
            if (localCount != serverCount) {
                drift.add(new EntityDrift(entityType, localCount, serverCount, Math.abs(localCount - serverCount)));
            }
        }

        drift.sort(Comparator.comparingLong(EntityDrift::getDifference).reversed().thenComparing(EntityDrift::getEntityType));
        return drift;
    }

    /**
     * Get current sync health status (called by controllers/UI).
     * Attaches live timer info (nextCheckDueAt, healthCheckIntervalMs) computed from current settings.
     */
    public SyncHealthResult getCurrentHealth() {
        SyncHealthResult result = currentHealth.get();
        attachTimerInfo(result);
        return result;
    }

    /**
     * Force an immediate health check (for manual trigger).
     */
    public SyncHealthResult checkNow() {
        checkSyncHealth();
        SyncHealthResult result = currentHealth.get();
        attachTimerInfo(result);
        return result;
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
        } else if (result.getSyncStatus() == SyncStatus.POSSIBLY_OUT_OF_SYNC) {
            // Actively catching up — don't increment counter, don't suggest resync
            result.setSuggestResync(false);
            result.setLastSuccessfulSyncTime(lastSuccessfulSyncTime.get());
        } else if (result.getSyncStatus() == SyncStatus.OUT_OF_SYNC) {
            // During startup grace period, don't increment — initial sync may still be running
            if (now.isBefore(startupTime.plusSeconds(STARTUP_GRACE_MINUTES * 60))) {
                result.setSuggestResync(false);
                result.setLastSuccessfulSyncTime(lastSuccessfulSyncTime.get());
                return;
            }

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
        log.debug("Recorded successful sync at {}", lastSuccessfulSyncTime.get());
    }

    /**
     * Attach live timer info to a result so the UI can display a countdown.
     */
    private void attachTimerInfo(SyncHealthResult result) {
        if (result == null) return;
        long intervalMs = syncIntervals.getHealthCheckIntervalMs();
        long lastCheck = syncIntervals.getLastHealthCheckTime();
        result.setHealthCheckIntervalMs(intervalMs);
        if (lastCheck > 0) {
            result.setNextCheckDueAt(Instant.ofEpochMilli(lastCheck + intervalMs));
        } else {
            // No check has run yet — show "due now" so the timer is visible immediately
            result.setNextCheckDueAt(Instant.now());
        }
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
        private List<EntityDrift> entityDrift = new ArrayList<>();
        private FileDrift fileDrift;

        // Sync suggestion fields
        private boolean suggestResync;              // True if system recommends a resync
        private String suggestedSyncDate;           // yyyy-MM-dd format date to sync from
        private Instant lastSuccessfulSyncTime;     // When was the last successful sync
        private String recommendation;              // Human-readable recommendation message
        private int consecutiveOutOfSyncCount;      // How many consecutive checks were out of sync
        private AutoResyncService.AutoResyncState autoResyncState; // Current auto-resync escalation state
        private boolean backlogDetected;
        private long serverPendingChangesForClient;

        // Timer fields for UI countdown
        private Instant nextCheckDueAt;             // When the next health check will run
        private long healthCheckIntervalMs;         // Current interval in milliseconds
    }

    @Data
    public static class LocalSyncStats {
        private Map<String, Long> entityCounts = new HashMap<>();
        private long totalEntities;
        private long fileCount;
        private long totalFileBytes;
        private Instant latestChangeTime;
        private long recentChangeCount;
        private long pendingSyncCount;
    }

    @Data
    public static class ServerSyncStats {
        private Map<String, Long> entityCounts = new HashMap<>();
        private long totalEntities;
        private long fileCount;
        private long totalFileBytes;
        private Instant latestChangeTime;
        private long totalFieldChanges;
        private long pendingChangesForClient;
    }

    @Data
    public static class EntityDrift {
        private final String entityType;
        private final long localCount;
        private final long serverCount;
        private final long difference;
    }

    @Data
    public static class FileDrift {
        private final long localCount;
        private final long serverCount;
        private final long difference;
    }
}
