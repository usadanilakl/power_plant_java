package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE endpoint for pushing sync updates to connected frontend clients.
 * When changes are applied from server sync, this broadcasts to all connected clients
 * so they can reactively update their UI.
 */
@RestController
@RequestMapping("/api/sync-updates")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SyncUpdateController {

    private final ObjectMapper objectMapper;

    // Store active SSE connections
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * SSE endpoint for clients to subscribe to sync updates.
     * Clients call this to establish a persistent connection for receiving updates.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToUpdates() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // No timeout

        emitters.add(emitter);
        log.info("New SSE client connected. Total clients: {}", emitters.size());

        // Send initial connection confirmation
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            log.warn("Failed to send connection confirmation: {}", e.getMessage());
        }

        // Cleanup on completion or error
        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.info("SSE client disconnected (completion). Total clients: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            log.info("SSE client disconnected (timeout). Total clients: {}", emitters.size());
        });

        emitter.onError((ex) -> {
            emitters.remove(emitter);
            log.info("SSE client disconnected (error): {}. Total clients: {}", ex.getMessage(), emitters.size());
        });

        return emitter;
    }

    /**
     * Broadcast entity update to all connected clients.
     * Called by sync service when changes are applied from server.
     */
    public void broadcastEntityUpdate(String entityType, Long entityId, List<FieldChange> changes) {
        if (emitters.isEmpty()) {
            log.debug("No SSE clients connected, skipping broadcast");
            return;
        }

        try {
            Map<String, Object> payload = Map.of(
                "type", "entity_updated",
                "entityType", entityType,
                "entityId", entityId,
                "changes", changes,
                "timestamp", System.currentTimeMillis()
            );

            String json = objectMapper.writeValueAsString(payload);

            log.debug("Broadcasting entity update to {} clients: {} #{}", emitters.size(), entityType, entityId);

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                        .name("entity_updated")
                        .data(json));
                } catch (IOException e) {
                    log.debug("Failed to send to client, will be removed: {}", e.getMessage());
                    emitters.remove(emitter);
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting entity update: {}", e.getMessage());
        }
    }

    /**
     * Broadcast sync completion event.
     * Lets clients know a sync cycle completed with summary info.
     */
    public void broadcastSyncComplete(int changesApplied, int changesReceived) {
        if (emitters.isEmpty()) {
            return;
        }

        try {
            Map<String, Object> payload = Map.of(
                "type", "sync_complete",
                "changesApplied", changesApplied,
                "changesReceived", changesReceived,
                "timestamp", System.currentTimeMillis()
            );

            String json = objectMapper.writeValueAsString(payload);

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                        .name("sync_complete")
                        .data(json));
                } catch (IOException e) {
                    emitters.remove(emitter);
                }
            }
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

                for (SseEmitter emitter : emitters) {
                    try {
                        emitter.send(SseEmitter.event()
                            .name("sync_activity")
                            .data(json));
                    } catch (IOException e) {
                        emitters.remove(emitter);
                    }
                }
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
