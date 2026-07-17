package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SSE endpoint for pushing sync updates to connected frontend clients.
 * When changes are applied from server sync, this broadcasts to all connected clients
 * so they can reactively update their UI.
 *
 * Emitters are keyed by clientId so that reconnects from the same browser tab
 * immediately evict the stale emitter instead of accumulating.
 */
@RestController
@RequestMapping("/api/sync-updates")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SyncUpdateController {

    // 10 min (matches HubSseService). The 15s heartbeat keeps the connection alive and detects death
    // on both ends (server via send-failure cleanup, browser via missed heartbeats -> EventSource
    // reconnect), so the emitter timeout is only a safety cap. It was 60s, which forced every browser
    // tab to reconnect to /stream once a minute — pure churn (the connect/disconnect log flood) with a
    // brief refresh gap each time. Longer timeout = ~10x fewer reconnects, same liveness.
    private static final long EMITTER_TIMEOUT_MS = 600_000L;
    private static final long HEARTBEAT_INTERVAL_MS = 15_000L;

    private final ObjectMapper objectMapper;

    /** Active SSE connections keyed by clientId. One emitter per client. */
    private final ConcurrentHashMap<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    private ScheduledExecutorService heartbeatExecutor;

    @PostConstruct
    void startHeartbeat() {
        heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "sse-heartbeat");
            t.setDaemon(true);
            return t;
        });
        heartbeatExecutor.scheduleAtFixedRate(this::sendHeartbeat,
                HEARTBEAT_INTERVAL_MS, HEARTBEAT_INTERVAL_MS, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    void stopHeartbeat() {
        if (heartbeatExecutor != null) heartbeatExecutor.shutdownNow();
    }

    /**
     * SSE endpoint for clients to subscribe to sync updates.
     * Each client must pass a unique {@code clientId} query parameter.
     * Reconnects with the same clientId evict the previous emitter immediately,
     * preventing connection accumulation.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToUpdates(@RequestParam(defaultValue = "") String clientId) {
        // Assign a server-generated ID if the client didn't provide one (backward compat)
        if (clientId.isBlank()) {
            clientId = UUID.randomUUID().toString();
        }

        // Evict any previous emitter for the same client
        SseEmitter oldEmitter = emitters.remove(clientId);
        if (oldEmitter != null) {
            log.debug("Evicting previous SSE emitter for clientId={}", clientId);
            try { oldEmitter.complete(); } catch (Exception ignored) {}
        }

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.put(clientId, emitter);
        log.info("New SSE client connected. clientId={} Total clients: {}", clientId, emitters.size());

        // Send initial connection confirmation
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            log.warn("Failed to send connection confirmation: {}", e.getMessage());
        }

        // Capture clientId for callbacks (must be effectively final)
        final String cid = clientId;

        // Cleanup on completion or error — remove only if this emitter is still the active one for this clientId
        Runnable removeIfCurrent = () -> emitters.remove(cid, emitter);

        emitter.onCompletion(() -> {
            removeIfCurrent.run();
            log.info("SSE client disconnected (completion). clientId={} Total clients: {}", cid, emitters.size());
        });

        emitter.onTimeout(() -> {
            removeIfCurrent.run();
            log.info("SSE client disconnected (timeout). clientId={} Total clients: {}", cid, emitters.size());
        });

        emitter.onError((ex) -> {
            removeIfCurrent.run();
            log.info("SSE client disconnected (error): {}. clientId={} Total clients: {}", ex.getMessage(), cid, emitters.size());
        });

        return emitter;
    }

    /**
     * Send a heartbeat comment to all emitters.
     * Dead connections will throw IOException, triggering their onError callback and removal.
     */
    private void sendHeartbeat() {
        if (emitters.isEmpty()) return;
        emitters.forEach((cid, emitter) -> {
            try {
                emitter.send(SseEmitter.event().comment("heartbeat"));
            } catch (Exception e) {
                emitters.remove(cid, emitter);
            }
        });
    }

    /** Send an SSE event to all connected emitters, removing any that fail. */
    private void broadcastEvent(String eventName, String json) {
        emitters.forEach((cid, emitter) -> {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(json));
            } catch (IOException e) {
                log.debug("Failed to send {} to clientId={}, removing: {}", eventName, cid, e.getMessage());
                emitters.remove(cid, emitter);
            }
        });
    }

    /**
     * Broadcast entity update to all connected clients. Existing signature —
     * used by the receive-path callers in {@code FieldSyncService} when this
     * server applies a change RECEIVED from a peer machine (originClientId
     * is unknown at that layer, so all local tabs get the event).
     */
    public void broadcastEntityUpdate(String entityType, Long entityId, List<FieldChange> changes) {
        broadcastEntityUpdate(entityType, entityId, changes, null);
    }

    /**
     * Broadcast entity update, optionally stamped with the writing tab's
     * client id. Consumers use it to filter out their own writes so the
     * initiating tab doesn't refetch immediately after its own successful
     * save. Called from {@code LocalChangeSseBroadcaster} when this server
     * originates a change via a Ng REST call.
     */
    public void broadcastEntityUpdate(String entityType, Long entityId, List<FieldChange> changes, String originClientId) {
        if (emitters.isEmpty()) {
            log.debug("No SSE clients connected, skipping broadcast");
            return;
        }

        try {
            java.util.LinkedHashMap<String, Object> payload = new java.util.LinkedHashMap<>();
            payload.put("type", "entity_updated");
            payload.put("entityType", entityType);
            payload.put("entityId", entityId);
            payload.put("changes", changes);
            payload.put("timestamp", System.currentTimeMillis());
            if (originClientId != null) {
                payload.put("originClientId", originClientId);
            }

            String json = objectMapper.writeValueAsString(payload);
            log.debug("Broadcasting entity update to {} clients: {} #{}", emitters.size(), entityType, entityId);
            broadcastEvent("entity_updated", json);
        } catch (Exception e) {
            log.error("Error broadcasting entity update: {}", e.getMessage());
        }
    }

    /**
     * Broadcast sync completion event.
     * Lets clients know a sync cycle completed with summary info.
     */
    public void broadcastSyncComplete(int changesApplied, int changesReceived) {
        if (emitters.isEmpty()) return;

        try {
            Map<String, Object> payload = Map.of(
                "type", "sync_complete",
                "changesApplied", changesApplied,
                "changesReceived", changesReceived,
                "timestamp", System.currentTimeMillis()
            );

            String json = objectMapper.writeValueAsString(payload);
            broadcastEvent("sync_complete", json);
        } catch (Exception e) {
            log.error("Error broadcasting sync complete: {}", e.getMessage());
        }
    }

    /**
     * Broadcast a sync activity event to all connected clients.
     * Used to show real-time sync activity feed in the UI.
     * Runs async to avoid blocking the sync transaction thread.
     */
    public void broadcastSyncActivity(SyncActivityEvent event) {
        if (emitters.isEmpty()) return;

        // Run in a separate thread so SSE I/O doesn't block the sync transaction
        Thread.startVirtualThread(() -> {
            try {
                String json = objectMapper.writeValueAsString(event);
                broadcastEvent("sync_activity", json);
            } catch (Exception e) {
                log.debug("Error broadcasting sync activity: {}", e.getMessage());
            }
        });
    }

    /**
     * Get number of connected clients (for status endpoint).
     */
    public int getConnectedClientCount() {
        return emitters.size();
    }

    /**
     * DTO for sync activity events broadcast to the frontend.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SyncActivityEvent {
        private String direction;     // "SENDING" or "RECEIVING"
        private String entityType;
        private String entityId;
        private String changeType;    // "CREATE", "UPDATE", "DELETE"
        private String status;        // "SUCCESS", "FAILED", "SKIPPED"
        private long timestamp;
    }
}
