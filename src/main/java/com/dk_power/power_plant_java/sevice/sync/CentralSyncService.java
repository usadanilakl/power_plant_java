package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Handles synchronization with a central sync server.
 * This replaces peer-to-peer sync when sync.server.enabled=true.
 *
 * Key improvements for large data handling:
 * - Batched sync with configurable batch size (default 500)
 * - Pagination support for retrieving changes
 * - Progress tracking for long-running syncs
 * - Graceful handling of partial failures
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CentralSyncService {

    private final FieldChangeRepository fieldChangeRepository;
    private final SyncConfig syncConfig;
    private final RestTemplate restTemplate;
    private final SyncContext syncContext;
    private final FieldSyncService fieldSyncService;
    private final ApplicationContext applicationContext;

    // Lazily fetched to avoid circular dependency
    private ServerSseClient serverSseClient;

    // Using AtomicBoolean instead of volatile boolean to prevent race conditions
    // where two threads could both pass the syncing check simultaneously
    private final AtomicBoolean syncing = new AtomicBoolean(false);
    private volatile boolean serverAvailable = false;
    private final AtomicBoolean pendingSyncRequest = new AtomicBoolean(false);

    // Sync metrics
    private final AtomicLong totalChangesSent = new AtomicLong(0);
    private final AtomicLong totalChangesReceived = new AtomicLong(0);
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);

    // Configurable batch size - can be adjusted based on network/memory constraints
    private static final int DEFAULT_BATCH_SIZE = 500;
    private static final int MAX_CONSECUTIVE_FAILURES = 5;

    private ServerSseClient getServerSseClient() {
        if (serverSseClient == null) {
            serverSseClient = applicationContext.getBean(ServerSseClient.class);
        }
        return serverSseClient;
    }

    /**
     * Get the configured batch size for sync operations.
     */
    private int getBatchSize() {
        // Could be made configurable via SyncConfig
        return DEFAULT_BATCH_SIZE;
    }

    /**
     * Sync with central server on application startup.
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (!syncConfig.isServerSyncEnabled()) {
            log.info("Central server sync is disabled");
            return;
        }

        log.info("Application ready - syncing with central server: {}", syncConfig.getSyncServerUrl());

        // Small delay to ensure all services are initialized
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        syncWithServer();
    }

    /**
     * Triggered when local changes are detected.
     * Uses small delay to ensure the transaction that created the changes has committed.
     */
    @Async
    @EventListener
    public void onChangesDetected(SyncEventPublisher.ChangesDetectedEvent event) {
        if (!syncConfig.isServerSyncEnabled()) {
            return; // Let peer-to-peer handle it
        }

        if (event.getChanges() == null || event.getChanges().isEmpty()) {
            return;
        }

        log.info("Changes detected ({} changes), scheduling sync with central server", event.getChanges().size());

        // Small delay to ensure the transaction that created the FieldChange records has committed
        // This prevents race condition where we query for changes before they're visible
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        // If sync is in progress, wait for it to finish then retry
        int retries = 0;
        while (syncing.get() && retries < 5) {
            try {
                Thread.sleep(1000);
                retries++;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }

        syncWithServer();
    }

    /**
     * Periodic sync with server (backup in case event-driven sync misses something).
     */
    @Scheduled(fixedDelayString = "${sync.interval.seconds:30}000", initialDelay = 60000)
    public void periodicSync() {
        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }
        syncWithServer();
    }

    /**
     * Main sync method - sends local changes to server, receives changes from server.
     * Now uses batched processing to handle large datasets safely.
     */
    public SyncResult syncWithServer() {
        if (!syncConfig.isServerSyncEnabled()) {
            return new SyncResult(false, "Server sync not enabled", 0, 0, 0);
        }

        // Use compareAndSet for atomic check-and-set to prevent race conditions
        if (!syncing.compareAndSet(false, true)) {
            log.debug("Sync already in progress, marking pending sync request");
            pendingSyncRequest.set(true);
            return new SyncResult(false, "Sync in progress", 0, 0, 0);
        }

        // Circuit breaker: if too many consecutive failures, back off
        if (consecutiveFailures.get() >= MAX_CONSECUTIVE_FAILURES) {
            log.warn("Too many consecutive sync failures ({}), backing off", consecutiveFailures.get());
            // Reset after some failures to allow retry
            if (consecutiveFailures.get() > MAX_CONSECUTIVE_FAILURES * 2) {
                consecutiveFailures.set(0);
            }
            syncing.set(false); // Release the lock we acquired
            return new SyncResult(false, "Circuit breaker open - too many failures", 0, 0, 0);
        }

        // syncing is already true from compareAndSet above
        pendingSyncRequest.set(false);
        SyncResult result = new SyncResult();

        try {
            // Phase 1: Send outgoing changes in batches
            int totalSent = sendOutgoingChangesInBatches();
            result.setChangesSent(totalSent);

            // Phase 2: Receive incoming changes in batches
            BatchedReceiveResult receiveResult = receiveIncomingChangesInBatches();
            result.setChangesReceived(receiveResult.totalReceived);
            result.setChangesApplied(receiveResult.totalApplied);

            result.setSuccess(true);
            serverAvailable = true;
            consecutiveFailures.set(0); // Reset on success

            // Update metrics
            totalChangesSent.addAndGet(totalSent);
            totalChangesReceived.addAndGet(receiveResult.totalReceived);

            log.info("Server sync complete: sent={}, received={}, applied={}",
                result.getChangesSent(), result.getChangesReceived(), result.getChangesApplied());

        } catch (Exception e) {
            serverAvailable = false;
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            consecutiveFailures.incrementAndGet();
            log.error("Failed to sync with server: {}", e.getMessage());
            // Changes remain in local DB, will be synced when server is available
        } finally {
            syncing.set(false);

            // If another sync was requested while we were syncing, trigger it now
            if (pendingSyncRequest.compareAndSet(true, false)) {
                log.info("Processing pending sync request");
                // Use async to avoid stack overflow with recursive calls
                new Thread(() -> {
                    try {
                        Thread.sleep(200);
                        syncWithServer();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }).start();
            }
        }

        return result;
    }

    /**
     * Send outgoing changes to server in batches.
     * This prevents memory issues with large change sets.
     */
    @Transactional
    protected int sendOutgoingChangesInBatches() {
        int batchSize = getBatchSize();
        int totalSent = 0;
        int batchNumber = 0;

        // First, count total pending changes
        long totalPending = fieldChangeRepository.countPendingChangesFor("SERVER");
        if (totalPending == 0) {
            log.debug("No outgoing changes to send");
            return 0;
        }

        log.info("Sending {} pending changes to server in batches of {}", totalPending, batchSize);

        // Process in batches until no more changes
        while (true) {
            Page<FieldChange> batch = fieldChangeRepository.findChangesNotSyncedTo(
                "SERVER", PageRequest.of(0, batchSize)); // Always page 0 since we mark as synced

            if (batch.isEmpty()) {
                break;
            }

            List<FieldChange> changes = batch.getContent();
            batchNumber++;

            try {
                // Send this batch
                SyncResponse response = sendBatchToServer(changes);

                if (response != null && response.isSuccess()) {
                    // Mark changes as synced
                    for (FieldChange change : changes) {
                        change.addSyncedMachine("SERVER");
                    }
                    fieldChangeRepository.saveAll(changes);
                    totalSent += changes.size();

                    log.debug("Batch {}: sent {} changes successfully", batchNumber, changes.size());
                } else {
                    log.warn("Batch {} failed: {}", batchNumber,
                        response != null ? response.getErrorMessage() : "null response");
                    break; // Stop on failure, will retry next sync
                }
            } catch (Exception e) {
                log.error("Error sending batch {}: {}", batchNumber, e.getMessage());
                break; // Stop on error, will retry next sync
            }

            // Safety check to prevent infinite loop
            if (batchNumber > 1000) {
                log.warn("Too many batches ({}), stopping to prevent infinite loop", batchNumber);
                break;
            }
        }

        log.info("Finished sending {} changes in {} batches", totalSent, batchNumber);
        return totalSent;
    }

    /**
     * Send a single batch of changes to the server.
     */
    private SyncResponse sendBatchToServer(List<FieldChange> changes) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/exchange";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Machine-Name", syncConfig.getMachineName());
        headers.set("Accept-Encoding", "gzip"); // Request compressed response

        Map<String, Object> request = new HashMap<>();
        request.put("machineId", syncConfig.getMachineId());
        request.put("machineName", syncConfig.getMachineName());
        request.put("changes", changes);
        request.put("batchMode", true); // Indicate batched sync

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        ResponseEntity<SyncResponse> response = restTemplate.exchange(
            url, HttpMethod.POST, entity,
            new ParameterizedTypeReference<SyncResponse>() {}
        );

        return response.getBody();
    }

    /**
     * Receive incoming changes from server in batches.
     */
    @Transactional
    protected BatchedReceiveResult receiveIncomingChangesInBatches() {
        BatchedReceiveResult result = new BatchedReceiveResult();
        int batchSize = getBatchSize();
        int batchNumber = 0;

        // First, check how many changes the server has for us
        long pendingCount = getPendingChangeCountFromServer();
        if (pendingCount < 0) {
            // Server is unreachable - propagate as error so circuit breaker works
            throw new RuntimeException("Server unreachable - cannot get pending change count");
        }
        if (pendingCount == 0) {
            log.debug("No incoming changes from server");
            return result;
        }

        log.info("Receiving approximately {} pending changes from server in batches of {}", pendingCount, batchSize);

        // Request changes in batches using the paginated endpoint
        int page = 0;
        while (true) {
            try {
                List<FieldChange> batch = fetchBatchFromServer(page, batchSize);

                if (batch == null || batch.isEmpty()) {
                    break;
                }

                batchNumber++;
                result.totalReceived += batch.size();

                // Apply this batch within sync context
                int applied = applyIncomingChanges(batch);
                result.totalApplied += applied;

                log.debug("Batch {}: received {} changes, applied {}", batchNumber, batch.size(), applied);

                // If we got less than batch size, we've reached the end
                if (batch.size() < batchSize) {
                    break;
                }

                page++;

                // Safety check
                if (batchNumber > 1000) {
                    log.warn("Too many receive batches ({}), stopping", batchNumber);
                    break;
                }
            } catch (Exception e) {
                log.error("Error receiving batch {}: {}", batchNumber, e.getMessage());
                break;
            }
        }

        log.info("Finished receiving {} changes ({} applied) in {} batches",
            result.totalReceived, result.totalApplied, batchNumber);
        return result;
    }

    /**
     * Get the count of pending changes from server.
     * Returns -1 if the server is unreachable, so callers can distinguish
     * "no changes" from "server is down".
     */
    private long getPendingChangeCountFromServer() {
        try {
            String url = syncConfig.getSyncServerUrl() + "/api/sync/changes/count";

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Machine-Id", syncConfig.getMachineId());

            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Long>> response = restTemplate.exchange(
                url, HttpMethod.GET, entity,
                new ParameterizedTypeReference<Map<String, Long>>() {}
            );

            Map<String, Long> body = response.getBody();
            return body != null ? body.getOrDefault("count", 0L) : 0L;
        } catch (Exception e) {
            log.warn("Failed to get pending change count: {}", e.getMessage());
            return -1L;
        }
    }

    /**
     * Fetch a batch of changes from the server.
     */
    private List<FieldChange> fetchBatchFromServer(int page, int size) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/changes/batch?page=" + page + "&size=" + size;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Machine-Name", syncConfig.getMachineName());
        headers.set("Accept-Encoding", "gzip");

        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<List<FieldChange>> response = restTemplate.exchange(
            url, HttpMethod.GET, entity,
            new ParameterizedTypeReference<List<FieldChange>>() {}
        );

        return response.getBody();
    }

    /**
     * Helper class for batched receive results.
     */
    private static class BatchedReceiveResult {
        int totalReceived = 0;
        int totalApplied = 0;
    }

    /**
     * Apply incoming changes from server using LWW.
     */
    private int applyIncomingChanges(List<FieldChange> incomingChanges) {
        syncContext.startSync();
        try {
            return fieldSyncService.applyIncomingChanges(incomingChanges);
        } finally {
            syncContext.endSync();
        }
    }

    /**
     * Check if server is available.
     */
    public boolean isServerAvailable() {
        return serverAvailable;
    }

    /**
     * Check if SSE real-time connection is active.
     */
    public boolean isSseConnected() {
        try {
            ServerSseClient client = getServerSseClient();
            return client != null && client.isConnected();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get pending changes count (not yet synced to server).
     * Uses count query instead of loading all changes.
     */
    public long getPendingChangeCount() {
        return fieldChangeRepository.countPendingChangesFor("SERVER");
    }

    /**
     * Check server health.
     */
    public boolean checkServerHealth() {
        if (!syncConfig.isServerSyncEnabled()) {
            return false;
        }

        try {
            String url = syncConfig.getSyncServerUrl() + "/api/sync/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            serverAvailable = response.getStatusCode().is2xxSuccessful();
            return serverAvailable;
        } catch (Exception e) {
            serverAvailable = false;
            return false;
        }
    }

    /**
     * Get sync metrics for monitoring.
     */
    public SyncMetrics getMetrics() {
        return new SyncMetrics(
            totalChangesSent.get(),
            totalChangesReceived.get(),
            consecutiveFailures.get(),
            syncing.get(),
            serverAvailable,
            isSseConnected(),
            getPendingChangeCount()
        );
    }

    /**
     * Reset consecutive failure counter and mark server as available.
     * Called when server connectivity is confirmed (e.g., SSE connection established).
     */
    public void resetCircuitBreaker() {
        consecutiveFailures.set(0);
        serverAvailable = true;
        log.info("Circuit breaker reset - server marked as available");
    }

    // DTOs
    @lombok.Data
    public static class SyncResponse {
        private boolean success;
        private int changesReceived;
        private int duplicatesSkipped;
        private int changesSent;
        private List<FieldChange> changes;
        private String errorMessage;
        // Pagination support
        private int page;
        private int totalPages;
        private long totalElements;
        private boolean hasMore;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SyncResult {
        private boolean success;
        private String errorMessage;
        private int changesSent;
        private int changesReceived;
        private int changesApplied;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SyncMetrics {
        private long totalChangesSent;
        private long totalChangesReceived;
        private int consecutiveFailures;
        private boolean syncInProgress;
        private boolean serverAvailable;
        private boolean sseConnected;
        private long pendingChanges;
    }
}
