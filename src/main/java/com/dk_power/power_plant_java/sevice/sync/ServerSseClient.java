package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.file.FileRepo;

/**
 * SSE Client that connects to the sync server and receives real-time change notifications.
 *
 * Key features:
 * - Automatic reconnection with exponential backoff
 * - Circuit breaker pattern: backs off after too many failures
 * - Infinite loop prevention: changes received via SSE are marked to prevent re-broadcasting
 * - Connection health monitoring
 * - Graceful shutdown
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServerSseClient {

    private final SyncConfig syncConfig;
    private final SyncContext syncContext;
    private final FieldSyncService fieldSyncService;
    private final ObjectMapper objectMapper;
    private final FileRepo fileRepo;
    private final FileObjectSyncHandler fileObjectSyncHandler;
    private final ApplicationContext applicationContext;
    private final com.dk_power.power_plant_java.sevice.users.LocalScheduleHeartbeatCache scheduleHeartbeatCache;

    // Lazily fetched to avoid circular dependency with CentralSyncService
    private CentralSyncService centralSyncService;

    private CentralSyncService getCentralSyncService() {
        if (centralSyncService == null) {
            centralSyncService = applicationContext.getBean(CentralSyncService.class);
        }
        return centralSyncService;
    }

    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "sse-client");
        t.setDaemon(true); // Daemon thread won't block JVM shutdown
        return t;
    });
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicBoolean shouldReconnect = new AtomicBoolean(true);
    private final AtomicBoolean shuttingDown = new AtomicBoolean(false);
    private final AtomicInteger reconnectAttempts = new AtomicInteger(0);
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private final AtomicLong totalEventsReceived = new AtomicLong(0);
    private final AtomicLong totalChangesApplied = new AtomicLong(0);

    private static final int MAX_RECONNECT_DELAY_SECONDS = 15;
    private static final int BASE_RECONNECT_DELAY_SECONDS = 2;
    private static final int CIRCUIT_BREAKER_THRESHOLD = 30;
    private static final int CIRCUIT_BREAKER_RESET_DELAY_MINUTES = 2;

    // SSE event buffering: accumulate rapid SSE batches and process as a single batch.
    // The server broadcasts changes in batches of ~100. When entities span batches,
    // cross-batch ManyToMany/ManyToOne references fail because the referenced entity
    // isn't created yet. By buffering all batches from a "wave" and processing together,
    // all entities are available during reference resolution.
    private static final long SSE_BUFFER_DELAY_MS = 2000; // 2 seconds after last event
    private final List<FieldChange> sseChangeBuffer = Collections.synchronizedList(new ArrayList<>());
    private final ScheduledExecutorService bufferScheduler = Executors.newSingleThreadScheduledExecutor(
        r -> { Thread t = new Thread(r, "sse-buffer-flush"); t.setDaemon(true); return t; });
    private volatile ScheduledFuture<?> bufferFlushTask;

    private volatile HttpURLConnection currentConnection;
    private volatile Instant lastSuccessfulConnection;
    private volatile Instant circuitBreakerOpenedAt;

    /**
     * Start SSE subscription after application is ready.
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (syncConfig.isHubMode()) {
            log.info("Hub mode - SSE client will not start (hub IS the server)");
            return;
        }
        if (!syncConfig.isServerSyncEnabled()) {
            log.info("Server sync disabled - SSE client will not start");
            return;
        }

        // Delay to let other services initialize
        try {
            Thread.sleep(6000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        startSseConnection();
    }

    /**
     * Start the SSE connection in a background thread.
     */
    public void startSseConnection() {
        if (running.get()) {
            log.debug("SSE connection already running");
            return;
        }

        shouldReconnect.set(true);
        executor.submit(this::connectAndListen);
    }

    /**
     * Main connection loop with automatic reconnection and circuit breaker.
     */
    private void connectAndListen() {
        while (shouldReconnect.get() && !shuttingDown.get()) {
            // Circuit breaker check
            if (isCircuitBreakerOpen()) {
                log.warn("Circuit breaker is open, waiting before retry...");
                try {
                    Thread.sleep(CIRCUIT_BREAKER_RESET_DELAY_MINUTES * 60 * 1000L);
                    if (shuttingDown.get()) break;
                    resetCircuitBreaker();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
                continue;
            }

            try {
                running.set(true);
                connect();
                // Connection ended normally (server closed it)
                consecutiveFailures.set(0);
            } catch (Exception e) {
                if (!shuttingDown.get()) {
                    log.warn("SSE connection error: {}", e.getMessage());
                    int failures = consecutiveFailures.incrementAndGet();
                    if (failures >= CIRCUIT_BREAKER_THRESHOLD) {
                        circuitBreakerOpenedAt = Instant.now();
                        log.error("Circuit breaker opened after {} consecutive failures", failures);
                    }
                }
            } finally {
                running.set(false);
            }

            if (shouldReconnect.get() && !shuttingDown.get() && !isCircuitBreakerOpen()) {
                int delay = calculateReconnectDelay();
                log.info("sse.reconnect.scheduled delaySeconds={}", delay);
                try {
                    Thread.sleep(delay * 1000L);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        log.info("SSE client stopped");
    }

    /**
     * Check if circuit breaker is open.
     */
    private boolean isCircuitBreakerOpen() {
        if (circuitBreakerOpenedAt == null) {
            return false;
        }
        // Auto-reset after the delay period
        if (Instant.now().isAfter(circuitBreakerOpenedAt.plusSeconds(CIRCUIT_BREAKER_RESET_DELAY_MINUTES * 60L))) {
            resetCircuitBreaker();
            return false;
        }
        return true;
    }

    /**
     * Reset the circuit breaker.
     */
    public void resetCircuitBreaker() {
        circuitBreakerOpenedAt = null;
        consecutiveFailures.set(0);
        log.info("sse.circuit_breaker.reset");
    }

    /**
     * Establish SSE connection and process events.
     */
    private void connect() throws Exception {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/sse/subscribe";
        log.debug("Connecting to SSE endpoint: {}", url);

        URL sseUrl = new URL(url);
        currentConnection = (HttpURLConnection) sseUrl.openConnection();
        currentConnection.setRequestMethod("GET");
        currentConnection.setRequestProperty("Accept", "text/event-stream");
        currentConnection.setRequestProperty("X-Machine-Id", syncConfig.getMachineId());
        currentConnection.setRequestProperty("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        currentConnection.setRequestProperty("X-Machine-Name", syncConfig.getMachineName());
        currentConnection.setConnectTimeout(10000);
        currentConnection.setReadTimeout(60000); // 60 second timeout to allow periodic shutdown checks

        int responseCode = currentConnection.getResponseCode();
        if (responseCode != 200) {
            throw new RuntimeException("SSE connection failed with status: " + responseCode);
        }

        log.info("SSE connection established successfully");
        reconnectAttempts.set(0); // Reset reconnect attempts on successful connection
        consecutiveFailures.set(0); // Reset failures on successful connection
        lastSuccessfulConnection = Instant.now();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(currentConnection.getInputStream()))) {

            String eventType = null;
            StringBuilder dataBuilder = new StringBuilder();

            while (shouldReconnect.get() && !shuttingDown.get()) {
                String line;
                try {
                    line = reader.readLine();
                } catch (java.net.SocketTimeoutException e) {
                    // Timeout is expected - allows periodic check for shutdown
                    log.debug("SSE read timeout - checking shutdown status");
                    continue;
                }

                if (line == null) {
                    // Server closed connection
                    break;
                }

                if (line.startsWith("event:")) {
                    eventType = line.substring(6).trim();
                } else if (line.startsWith("data:")) {
                    dataBuilder.append(line.substring(5).trim());
                } else if (line.isEmpty() && dataBuilder.length() > 0) {
                    // End of event - process it
                    if (!shuttingDown.get()) {
                        processEvent(eventType, dataBuilder.toString());
                    }
                    eventType = null;
                    dataBuilder.setLength(0);
                }
            }
        } finally {
            closeConnection();
        }
    }

    /**
     * Process an incoming SSE event.
     */
    private void processEvent(String eventType, String data) {
        try {
            if ("connected".equals(eventType)) {
                log.debug("SSE: Connected to server - {}", data);
                onSseConnected(data);
                return;
            }

            if ("heartbeat".equals(eventType)) {
                log.debug("SSE: Heartbeat received");
                return;
            }

            if ("sync".equals(eventType)) {
                handleSyncEvent(data);
                return;
            }

            if ("file_upload".equals(eventType)) {
                handleFileUploadEvent(data);
                return;
            }

            if ("schedule.refresh.requested".equals(eventType)) {
                handleScheduleRefreshRequested(data);
                return;
            }

            if ("schedule.check.heartbeat".equals(eventType)) {
                handleScheduleCheckHeartbeat(data);
                return;
            }

            log.debug("SSE: Unknown event type '{}': {}", eventType, data);

        } catch (Exception e) {
            log.error("Error processing SSE event '{}': {}", eventType, e.getMessage(), e);
        }
    }

    /**
     * Called when SSE connection is (re)established.
     * Triggers a full sync to catch up on any changes missed while disconnected.
     * This handles: client came online, server restarted, network recovered.
     */
    private void onSseConnected(String data) {
        if (shuttingDown.get()) {
            return; // Don't start new work during shutdown
        }

        try {
            CentralSyncService centralSync = getCentralSyncService();
            if (centralSync != null) {
                // Reset circuit breaker - server is clearly reachable
                centralSync.resetCircuitBreaker();

                // Trigger sync on separate daemon thread to not block SSE event processing
                Thread syncThread = new Thread(() -> {
                    try {
                        Thread.sleep(1000); // Brief delay to let SSE stabilize
                        if (!shuttingDown.get()) {
                            log.info("sse.connected.triggering_sync");
                            centralSync.syncWithServer();
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } catch (Exception e) {
                        log.error("Error during post-SSE-connect sync: {}", e.getMessage());
                    }
                }, "sse-reconnect-sync");
                syncThread.setDaemon(true); // Daemon thread won't block JVM shutdown
                syncThread.start();
            }
        } catch (Exception e) {
            log.warn("Could not trigger sync after SSE connection: {}", e.getMessage());
        }
    }

    /**
     * Handle incoming sync changes from SSE.
     *
     * Instead of processing each SSE batch immediately, changes are buffered and
     * processed together after a short delay (debounce). This prevents cross-batch
     * reference failures when the server splits changes across multiple SSE events.
     *
     * For example, if Equipment references FileObject but they're in different SSE
     * batches, processing them separately would fail the ManyToMany/ManyToOne links.
     * By buffering and processing together, all entities are available during linking.
     */
    private void handleSyncEvent(String data) {
        try {
            totalEventsReceived.incrementAndGet();

            // Parse the SSE data
            Map<String, Object> eventData = objectMapper.readValue(data, new TypeReference<>() {});

            String originMachineId = (String) eventData.get("originMachineId");

            // Double-check: don't process our own changes (server should already filter this)
            if (syncConfig.getMachineId().equals(originMachineId)) {
                log.debug("SSE: Ignoring our own changes");
                return;
            }

            // Parse the changes
            Object changesObj = eventData.get("changes");
            if (changesObj == null) {
                log.warn("SSE: Received sync event without changes");
                return;
            }

            List<FieldChange> changes = objectMapper.convertValue(changesObj,
                new TypeReference<List<FieldChange>>() {});

            log.debug("SSE: Received {} changes from {} - buffering for batch processing",
                changes.size(), originMachineId);

            // Add to buffer instead of processing immediately
            sseChangeBuffer.addAll(changes);

            // Schedule/reschedule the buffer flush (debounce pattern)
            // Each new event resets the timer, so rapid batches are accumulated
            scheduleBufferFlush();

        } catch (Exception e) {
            log.error("Error handling sync event: {}", e.getMessage(), e);
        }
    }

    /**
     * Schedule (or reschedule) the buffer flush with a debounce delay.
     * If another SSE event arrives before the delay expires, the timer is reset.
     */
    private void scheduleBufferFlush() {
        // Cancel previous scheduled flush
        if (bufferFlushTask != null && !bufferFlushTask.isDone()) {
            bufferFlushTask.cancel(false);
        }

        // Schedule new flush after delay
        bufferFlushTask = bufferScheduler.schedule(
            this::flushChangeBuffer, SSE_BUFFER_DELAY_MS, TimeUnit.MILLISECONDS);
    }

    /**
     * Process all buffered SSE changes as a single batch.
     * This ensures cross-batch entity references (ManyToMany, ManyToOne) resolve
     * correctly because all entities from all SSE batches are processed together.
     */
    private void flushChangeBuffer() {
        if (shuttingDown.get()) {
            log.debug("Skipping buffer flush during shutdown");
            return;
        }

        List<FieldChange> changes;
        synchronized (sseChangeBuffer) {
            if (sseChangeBuffer.isEmpty()) {
                return;
            }
            changes = new ArrayList<>(sseChangeBuffer);
            sseChangeBuffer.clear();
        }

        log.debug("SSE: Processing {} buffered changes as single batch", changes.size());

        // Apply all buffered changes within sync context
        syncContext.startSync();
        try {
            int applied = fieldSyncService.applyIncomingChanges(changes);
            totalChangesApplied.addAndGet(applied);
            log.debug("SSE: Applied {} of {} buffered changes", applied, changes.size());
        } catch (Exception e) {
            log.error("Error processing buffered SSE changes: {}", e.getMessage(), e);
        } finally {
            syncContext.endSync();
        }
    }

    /**
     * A peer desktop just verified SharePoint — bump our local heartbeat cache so our next
     * freshness gate sees the fresh signal and skips a redundant SP round-trip.
     */
    private void handleScheduleCheckHeartbeat(String data) {
        try {
            Map<String, Object> eventData = objectMapper.readValue(data, new TypeReference<>() {});
            Object at = eventData.get("checkedAt");
            Object src = eventData.get("source");
            if (!(at instanceof String s) || s.isBlank()) return;
            java.time.Instant instant = java.time.Instant.parse(s);
            String source = src instanceof String ss ? ss : null;
            scheduleHeartbeatCache.recordFromSse(instant, source);
            log.debug("[SSE] schedule.check.heartbeat cached checkedAt={} source={}", instant, source);
        } catch (Exception e) {
            log.debug("[SSE] Failed to parse schedule.check.heartbeat: {}", e.getMessage());
        }
    }

    /**
     * Handle hub-initiated schedule refresh request. Forwards to the local Electron main
     * process's HTTP trigger endpoint ({@code POST http://127.0.0.1:<port>/trigger/personnel-refresh}),
     * which invokes {@code PersonnelManager.refresh()} (SharePoint fetch → parse → local push →
     * CRDT sync back to hub). Fire-and-forget: SSE dispatch mustn't block.
     *
     * <p>The port comes from {@code personnel.trigger-port} (default 8083) — must match the
     * Electron side's {@code personnel-config.json refreshTriggerPort}. When Electron isn't
     * running or the endpoint isn't listening yet, the request quietly fails and the hub
     * watchdog will pick another client on its next tick.
     */
    private void handleScheduleRefreshRequested(String data) {
        int port = Integer.parseInt(System.getProperty("personnel.trigger-port",
                System.getenv().getOrDefault("PERSONNEL_TRIGGER_PORT", "8083")));
        log.info("[SSE] schedule.refresh.requested received — POSTing to Electron trigger on 127.0.0.1:{}", port);

        Thread.startVirtualThread(() -> {
            try {
                java.net.URL url = java.net.URI.create("http://127.0.0.1:" + port + "/trigger/personnel-refresh").toURL();
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(2_000);
                conn.setReadTimeout(5_000);
                conn.setDoOutput(true);
                conn.getOutputStream().write(new byte[0]);
                int status = conn.getResponseCode();
                log.info("[SSE] Electron personnel-refresh trigger returned {}", status);
                conn.disconnect();
            } catch (Exception e) {
                log.warn("[SSE] Failed to reach Electron trigger endpoint (Electron may not be running): {}",
                        e.getMessage());
            }
        });
    }

    /**
     * Handle incoming file upload notification from SSE.
     * This notifies us that another client has uploaded a file, so we should download it.
     */
    private void handleFileUploadEvent(String data) {
        try {
            Map<String, Object> eventData = objectMapper.readValue(data, new TypeReference<>() {});

            String entityType = (String) eventData.get("entityType");
            Long entityId = ((Number) eventData.get("entityId")).longValue();
            String fileName = (String) eventData.get("fileName");
            String originMachineId = (String) eventData.get("originMachineId");

            log.debug("SSE: File upload notification - {} for {}/{} from {}",
                fileName, entityType, entityId, originMachineId);

            // Only handle FileObject entities
            if (!"FileObject".equals(entityType)) {
                log.debug("SSE: Ignoring file upload for non-FileObject entity type: {}", entityType);
                return;
            }

            // Queue the file for download
            FileObject fileObject = fileRepo.findById(entityId).orElse(null);
            if (fileObject != null) {
                fileObjectSyncHandler.queueFileDownload(fileObject);
                log.debug("SSE: Queued download for FileObject #{} ({})", entityId, fileName);
            } else {
                // Entity might not be synced yet - the field sync will trigger download when it arrives
                log.debug("SSE: FileObject #{} not found locally, will download when entity syncs", entityId);
            }

        } catch (Exception e) {
            log.error("Error handling file_upload event: {}", e.getMessage(), e);
        }
    }

    /**
     * Calculate reconnection delay with exponential backoff.
     */
    private int calculateReconnectDelay() {
        int attempts = reconnectAttempts.incrementAndGet();
        int delay = BASE_RECONNECT_DELAY_SECONDS * (int) Math.pow(2, Math.min(attempts - 1, 5));
        return Math.min(delay, MAX_RECONNECT_DELAY_SECONDS);
    }

    /**
     * Close the current connection gracefully.
     */
    private void closeConnection() {
        if (currentConnection != null) {
            try {
                currentConnection.disconnect();
            } catch (Exception e) {
                log.debug("Error closing connection: {}", e.getMessage());
            }
            currentConnection = null;
        }
    }

    /**
     * Stop the SSE client.
     * After stopping, startSseConnection() can be called to restart.
     */
    public void stop() {
        log.info("Stopping SSE client...");
        shouldReconnect.set(false);
        running.set(false);
        closeConnection();
    }

    /**
     * Check if SSE client is connected.
     */
    public boolean isConnected() {
        return running.get() && currentConnection != null;
    }

    /**
     * Get SSE client metrics for monitoring.
     */
    public SseClientMetrics getMetrics() {
        return new SseClientMetrics(
            isConnected(),
            isCircuitBreakerOpen(),
            consecutiveFailures.get(),
            reconnectAttempts.get(),
            totalEventsReceived.get(),
            totalChangesApplied.get(),
            lastSuccessfulConnection
        );
    }

    /**
     * Graceful shutdown.
     */
    @PreDestroy
    public void shutdown() {
        log.info("SSE client shutdown initiated");
        shuttingDown.set(true);
        stop();

        // Force close connection to unblock any blocking reads
        closeConnection();

        // Shutdown executors
        executor.shutdownNow();
        bufferScheduler.shutdownNow();

        // Wait briefly for threads to terminate
        try {
            if (!executor.awaitTermination(2, TimeUnit.SECONDS)) {
                log.debug("SSE executor did not terminate in time (daemon thread will be killed on JVM exit)");
            }
            if (!bufferScheduler.awaitTermination(1, TimeUnit.SECONDS)) {
                log.debug("Buffer scheduler did not terminate in time");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        log.info("SSE client shutdown complete");
    }

    /**
     * SSE Client metrics for monitoring.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SseClientMetrics {
        private boolean connected;
        private boolean circuitBreakerOpen;
        private int consecutiveFailures;
        private int reconnectAttempts;
        private long totalEventsReceived;
        private long totalChangesApplied;
        private Instant lastSuccessfulConnection;
    }
}
