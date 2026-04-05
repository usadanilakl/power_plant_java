package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.sync.SyncUpdateController;
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
    private final WorkRequestMergeService workRequestMergeService;
    private final JhaMergeService jhaMergeService;
    private final SharePointSyncSettings syncIntervals;
    private final SyncUpdateController syncUpdateController;

    // Lazily fetched to avoid circular dependency
    private ServerSseClient serverSseClient;

    // Independent locks for send and receive — so local changes can reach the hub
    // immediately even while the receive phase is downloading a large backlog.
    private final AtomicBoolean sending = new AtomicBoolean(false);
    private final AtomicBoolean receiving = new AtomicBoolean(false);
    private volatile boolean serverAvailable = false;

    // When receive backlog exceeds this, skip incremental receive and recommend full resync
    private volatile boolean backlogTooLarge = false;
    private static final long BACKLOG_THRESHOLD = 5000;

    // Sync metrics
    private final AtomicLong totalChangesSent = new AtomicLong(0);
    private final AtomicLong totalChangesReceived = new AtomicLong(0);
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);

    private static final int DEFAULT_SEND_BATCH_SIZE = 5000;
    private static final int DEFAULT_RECEIVE_BATCH_SIZE = 500;
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
    private int getSendBatchSize() {
        return DEFAULT_SEND_BATCH_SIZE;
    }

    private int getReceiveBatchSize() {
        return DEFAULT_RECEIVE_BATCH_SIZE;
    }

    /**
     * Sync with central server on application startup.
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (syncConfig.isHubMode()) {
            log.info("server_sync.startup.skipped reason=hub_mode");
            return;
        }
        if (!syncConfig.isServerSyncEnabled()) {
            log.info("server_sync.startup.skipped reason=disabled");
            return;
        }

        log.info("server_sync.startup.begin url={}", syncConfig.getSyncServerUrl());

        try { Thread.sleep(5000); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        // Send first, then receive — send is fast and critical
        sendToServer();
        receiveFromServer();
    }

    /**
     * Triggered when local changes are detected.
     * Only sends — does NOT wait for receive. This ensures local changes
     * reach the hub within seconds regardless of any receive backlog.
     */
    @Async
    @EventListener
    public void onChangesDetected(SyncEventPublisher.ChangesDetectedEvent event) {
        if (syncConfig.isHubMode() || !syncConfig.isServerSyncEnabled()) return;
        if (event.getChanges() == null || event.getChanges().isEmpty()) return;

        log.debug("Changes detected ({} changes), sending to server", event.getChanges().size());

        // Small delay to ensure FieldChange transaction has committed
        try { Thread.sleep(500); } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        sendToServer();
    }

    /**
     * Polls every 15s; runs send + receive when interval has elapsed.
     */
    @Scheduled(fixedDelay = 15000, initialDelay = 60000)
    public void periodicSync() {
        if (syncConfig.isHubMode() || !syncConfig.isServerSyncEnabled()) return;
        if (!syncIntervals.isPeerSyncDue()) return;
        syncIntervals.markPeerSynced();
        sendToServer();
        receiveFromServer();
    }

    /**
     * Send local pending changes to the hub. Independent of receive — can run
     * even while receive is downloading. Uses its own lock so sends are never
     * blocked by a slow receive phase.
     */
    public SyncResult sendToServer() {
        if (!syncConfig.isServerSyncEnabled()) {
            return new SyncResult(false, "Server sync not enabled", 0, 0, 0);
        }

        if (!sending.compareAndSet(false, true)) {
            log.debug("Send already in progress, skipping");
            return new SyncResult(false, "Send in progress", 0, 0, 0);
        }

        SyncResult result = new SyncResult();
        try {
            int totalSent = sendOutgoingChangesInBatches();
            result.setChangesSent(totalSent);
            result.setSuccess(true);
            serverAvailable = true;
            consecutiveFailures.set(0);
            totalChangesSent.addAndGet(totalSent);

            if (totalSent > 0) {
                log.info("server_sync.send.done sent={}", totalSent);
            }
        } catch (Exception e) {
            serverAvailable = false;
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            consecutiveFailures.incrementAndGet();
            log.error("server_sync.send.failed: {}", e.getMessage());
        } finally {
            sending.set(false);
        }
        return result;
    }

    /**
     * Receive pending changes from the hub. Independent of send — uses its own lock.
     * If the backlog exceeds BACKLOG_THRESHOLD, skips incremental receive and sets
     * backlogTooLarge flag so the UI can recommend a full resync.
     */
    public SyncResult receiveFromServer() {
        if (!syncConfig.isServerSyncEnabled()) {
            return new SyncResult(false, "Server sync not enabled", 0, 0, 0);
        }

        if (!receiving.compareAndSet(false, true)) {
            log.debug("Receive already in progress, skipping");
            return new SyncResult(false, "Receive in progress", 0, 0, 0);
        }

        SyncResult result = new SyncResult();
        try {
            // Check backlog size before committing to a long download
            long pendingCount = getPendingChangeCountFromServer();
            if (pendingCount < 0) {
                throw new RuntimeException("Server unreachable");
            }
            if (pendingCount > BACKLOG_THRESHOLD) {
                backlogTooLarge = true;
                log.warn("server_sync.receive.skipped reason=large_backlog pending={} threshold={}. Full resync recommended.",
                    pendingCount, BACKLOG_THRESHOLD);
                result.setSuccess(true);
                result.setErrorMessage("Backlog too large (" + pendingCount + ") — full resync recommended");
                return result;
            }
            backlogTooLarge = false;

            BatchedReceiveResult receiveResult = receiveIncomingChangesInBatches();
            result.setChangesReceived(receiveResult.totalReceived);
            result.setChangesApplied(receiveResult.totalApplied);
            result.setSuccess(true);
            serverAvailable = true;

            totalChangesReceived.addAndGet(receiveResult.totalReceived);

            if (receiveResult.totalReceived > 0) {
                log.info("server_sync.receive.done received={} applied={}", receiveResult.totalReceived, receiveResult.totalApplied);
            }

            // Post-receive dedup
            if (receiveResult.totalApplied > 0) {
                try { workRequestMergeService.mergeIfDuplicatesExist(); } catch (Exception ex) {
                    log.error("Post-sync WorkRequest merge failed: {}", ex.getMessage(), ex);
                }
                try { jhaMergeService.mergeIfDuplicatesExist(); } catch (Exception ex) {
                    log.error("Post-sync JHA merge failed: {}", ex.getMessage(), ex);
                }
            }
        } catch (Exception e) {
            serverAvailable = false;
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            consecutiveFailures.incrementAndGet();
            log.error("server_sync.receive.failed: {}", e.getMessage());
        } finally {
            receiving.set(false);
        }
        return result;
    }

    /**
     * Combined sync — kept for backward compatibility (trigger endpoint, etc.).
     * Calls send then receive independently.
     */
    public SyncResult syncWithServer() {
        if (!syncConfig.isServerSyncEnabled()) {
            return new SyncResult(false, "Server sync not enabled", 0, 0, 0);
        }

        // Circuit breaker
        if (consecutiveFailures.get() >= MAX_CONSECUTIVE_FAILURES) {
            int failures = consecutiveFailures.incrementAndGet();
            if (failures > MAX_CONSECUTIVE_FAILURES * 2) {
                log.info("server_sync.circuit_breaker.self_heal failures={}", failures);
                consecutiveFailures.set(0);
            } else {
                log.warn("Too many consecutive sync failures ({}), backing off", failures);
                return new SyncResult(false, "Circuit breaker open - too many failures", 0, 0, 0);
            }
        }

        SyncResult sendResult = sendToServer();
        SyncResult receiveResult = receiveFromServer();

        SyncResult combined = new SyncResult();
        combined.setSuccess(sendResult.isSuccess() || receiveResult.isSuccess());
        combined.setChangesSent(sendResult.getChangesSent());
        combined.setChangesReceived(receiveResult.getChangesReceived());
        combined.setChangesApplied(receiveResult.getChangesApplied());
        if (!combined.isSuccess()) {
            combined.setErrorMessage(sendResult.getErrorMessage() != null ?
                sendResult.getErrorMessage() : receiveResult.getErrorMessage());
        }

        log.info("server_sync.run.complete sent={} received={} applied={}",
            combined.getChangesSent(), combined.getChangesReceived(), combined.getChangesApplied());

        return combined;
    }

    /**
     * Send outgoing changes to server in batches.
     * This prevents memory issues with large change sets.
     */
    @Transactional
    protected int sendOutgoingChangesInBatches() {
        int batchSize = getSendBatchSize();
        int totalSent = 0;
        int batchNumber = 0;

        // First, count total pending changes
        long totalPending = fieldChangeRepository.countPendingChangesFor("SERVER");
        if (totalPending == 0) {
            log.debug("No outgoing changes to send");
            return 0;
        }

        log.info("server_sync.send.start pending={} batchSize={}", totalPending, batchSize);

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

                    // Emit activity events for sent changes
                    for (FieldChange change : changes) {
                        try {
                            syncUpdateController.broadcastSyncActivity(
                                SyncUpdateController.SyncActivityEvent.builder()
                                    .direction("SENDING")
                                    .entityType(change.getEntityType())
                                    .entityId(String.valueOf(change.getEntityId()))
                                    .changeType(change.getChangeType() != null ? change.getChangeType().name() : "UPDATE")
                                    .status("SUCCESS")
                                    .timestamp(System.currentTimeMillis())
                                    .build());
                        } catch (Exception ignored) {}
                    }

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

        log.info("server_sync.send.complete sent={} batches={}", totalSent, batchNumber);
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
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
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
        int batchSize = getReceiveBatchSize();
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

        log.info("server_sync.receive.start pending={} batchSize={}", pendingCount, batchSize);

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

                // Acknowledge ALL received changes so hub marks them as synced to this client.
                // Even if applied=0 (LWW rejected them as older), the client has seen them
                // and doesn't need them again. Without this, unapplied changes stay pending
                // on the hub forever, causing the client to re-download them every cycle.
                try {
                    List<java.util.UUID> receivedIds = batch.stream()
                        .map(FieldChange::getId)
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toList());
                    if (!receivedIds.isEmpty()) {
                        acknowledgeChangesToServer(receivedIds);
                    }
                } catch (Exception ackEx) {
                    log.warn("Failed to acknowledge {} changes: {}", batch.size(), ackEx.getMessage());
                }

                log.debug("Batch {}: received {} changes, applied {}", batchNumber, batch.size(), applied);

                // If we got less than batch size, we've reached the end
                if (batch.size() < batchSize) {
                    break;
                }

                // Always fetch page 0 — acknowledged changes are removed from the
                // pending set, so the next unacknowledged batch is always at page 0.
                // Incrementing page would skip records.

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

        log.info("server_sync.receive.complete received={} applied={} batches={}",
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
            headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));

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
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
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
     * Acknowledge successfully applied changes to the server.
     * The server only marks changes as synced after this call,
     * so if the client fails to apply, the changes will be re-sent next cycle.
     */
    private void acknowledgeChangesToServer(List<java.util.UUID> changeIds) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/changes/acknowledge";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        headers.set("X-Machine-Id", syncConfig.getMachineId());

        HttpEntity<List<java.util.UUID>> entity = new HttpEntity<>(changeIds, headers);
        restTemplate.postForEntity(url, entity, Map.class);

        log.debug("Acknowledged {} changes to server", changeIds.size());
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
    public boolean isBacklogTooLarge() {
        return backlogTooLarge;
    }

    public SyncMetrics getMetrics() {
        return new SyncMetrics(
            totalChangesSent.get(),
            totalChangesReceived.get(),
            consecutiveFailures.get(),
            sending.get() || receiving.get(),
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
        log.info("server_sync.circuit_breaker.reset");
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
