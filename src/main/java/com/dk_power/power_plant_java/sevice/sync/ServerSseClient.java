package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

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

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicBoolean shouldReconnect = new AtomicBoolean(true);
    private final AtomicInteger reconnectAttempts = new AtomicInteger(0);
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private final AtomicLong totalEventsReceived = new AtomicLong(0);
    private final AtomicLong totalChangesApplied = new AtomicLong(0);

    private static final int MAX_RECONNECT_DELAY_SECONDS = 60;
    private static final int BASE_RECONNECT_DELAY_SECONDS = 2;
    private static final int CIRCUIT_BREAKER_THRESHOLD = 10;
    private static final int CIRCUIT_BREAKER_RESET_DELAY_MINUTES = 5;

    private volatile HttpURLConnection currentConnection;
    private volatile Instant lastSuccessfulConnection;
    private volatile Instant circuitBreakerOpenedAt;

    /**
     * Start SSE subscription after application is ready.
     */
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
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
        while (shouldReconnect.get()) {
            // Circuit breaker check
            if (isCircuitBreakerOpen()) {
                log.warn("Circuit breaker is open, waiting before retry...");
                try {
                    Thread.sleep(CIRCUIT_BREAKER_RESET_DELAY_MINUTES * 60 * 1000L);
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
                log.warn("SSE connection error: {}", e.getMessage());
                int failures = consecutiveFailures.incrementAndGet();
                if (failures >= CIRCUIT_BREAKER_THRESHOLD) {
                    circuitBreakerOpenedAt = Instant.now();
                    log.error("Circuit breaker opened after {} consecutive failures", failures);
                }
            } finally {
                running.set(false);
            }

            if (shouldReconnect.get() && !isCircuitBreakerOpen()) {
                int delay = calculateReconnectDelay();
                log.info("Reconnecting to SSE in {} seconds...", delay);
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
        log.info("Circuit breaker reset");
    }

    /**
     * Establish SSE connection and process events.
     */
    private void connect() throws Exception {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/sse/subscribe";
        log.info("Connecting to SSE endpoint: {}", url);

        URL sseUrl = new URL(url);
        currentConnection = (HttpURLConnection) sseUrl.openConnection();
        currentConnection.setRequestMethod("GET");
        currentConnection.setRequestProperty("Accept", "text/event-stream");
        currentConnection.setRequestProperty("X-Machine-Id", syncConfig.getMachineId());
        currentConnection.setRequestProperty("X-Machine-Name", syncConfig.getMachineName());
        currentConnection.setConnectTimeout(10000);
        currentConnection.setReadTimeout(0); // No read timeout for SSE

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

            String line;
            while ((line = reader.readLine()) != null && shouldReconnect.get()) {
                if (line.startsWith("event:")) {
                    eventType = line.substring(6).trim();
                } else if (line.startsWith("data:")) {
                    dataBuilder.append(line.substring(5).trim());
                } else if (line.isEmpty() && dataBuilder.length() > 0) {
                    // End of event - process it
                    processEvent(eventType, dataBuilder.toString());
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
                log.info("SSE: Connected to server - {}", data);
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

            log.debug("SSE: Unknown event type '{}': {}", eventType, data);

        } catch (Exception e) {
            log.error("Error processing SSE event '{}': {}", eventType, e.getMessage(), e);
        }
    }

    /**
     * Handle incoming sync changes from SSE.
     *
     * CRITICAL: This method uses SyncContext to prevent infinite loops.
     * When we apply these changes, the entity listeners should NOT broadcast them back.
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

            log.info("SSE: Received {} changes from {}", changes.size(), originMachineId);

            // Apply changes within sync context to prevent infinite loop
            // SyncContext.isSyncing() will return true, so entity listeners won't broadcast
            syncContext.startSync();
            try {
                int applied = fieldSyncService.applyIncomingChanges(changes);
                totalChangesApplied.addAndGet(applied);
                log.info("SSE: Applied {} of {} changes from {}", applied, changes.size(), originMachineId);
            } finally {
                syncContext.endSync();
            }

        } catch (Exception e) {
            log.error("Error handling sync event: {}", e.getMessage(), e);
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
     */
    public void stop() {
        log.info("Stopping SSE client...");
        shouldReconnect.set(false);
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
        stop();
        executor.shutdownNow();
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
