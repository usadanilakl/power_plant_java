package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Manages SSE connections for real-time change notifications in hub mode.
 * Clients subscribe to receive push notifications when other clients sync changes.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class HubSseService {

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emittersByMachine = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<EmitterInfo> allEmitters = new CopyOnWriteArrayList<>();

    // 10 minute timeout - clients will receive heartbeat every 30s and should reconnect if needed
    private static final long SSE_TIMEOUT_MS = 10 * 60 * 1000L;

    /**
     * Register a new SSE emitter for a client.
     */
    public SseEmitter createEmitter(String machineId, String machineName, long pendingChanges) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        EmitterInfo info = new EmitterInfo(machineId, machineName, emitter);
        allEmitters.add(info);

        emittersByMachine.computeIfAbsent(machineId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> {
            allEmitters.remove(info);
            CopyOnWriteArrayList<SseEmitter> machineEmitters = emittersByMachine.get(machineId);
            if (machineEmitters != null) {
                machineEmitters.remove(emitter);
                if (machineEmitters.isEmpty()) {
                    emittersByMachine.remove(machineId);
                }
            }
            log.debug("SSE connection closed for {} ({})", machineName, machineId);
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> {
            log.debug("SSE error for {} ({}): {}", machineName, machineId, e.getMessage());
            cleanup.run();
        });

        log.info("SSE connection established for {} ({}). Total connections: {}, pending changes: {}",
            machineName, machineId, allEmitters.size(), pendingChanges);

        // Send initial connection confirmation
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data(Map.of(
                    "message", "Connected to sync hub",
                    "machineId", machineId,
                    "pendingChanges", pendingChanges
                )));
        } catch (IOException e) {
            log.warn("Failed to send connection confirmation: {}", e.getMessage());
        }

        return emitter;
    }

    /**
     * Broadcast changes to all connected clients EXCEPT the origin machine.
     */
    public void broadcastChanges(List<FieldChange> changes, String originMachineId) {
        if (changes == null || changes.isEmpty()) {
            return;
        }

        int sentCount = 0;
        int failCount = 0;

        for (EmitterInfo info : allEmitters) {
            if (info.machineId.equals(originMachineId)) {
                continue;
            }

            try {
                info.emitter.send(SseEmitter.event()
                    .name("sync")
                    .data(Map.of(
                        "changes", changes,
                        "originMachineId", originMachineId,
                        "count", changes.size()
                    )));
                sentCount++;
            } catch (IOException e) {
                failCount++;
                log.debug("Failed to send to {} ({}): {}",
                    info.machineName, info.machineId, e.getMessage());
            }
        }

        if (sentCount > 0 || failCount > 0) {
            log.info("Broadcast {} changes from {} to {} clients ({} failed)",
                changes.size(), originMachineId, sentCount, failCount);
        }
    }

    /**
     * Send a heartbeat to all connected clients to keep connections alive.
     */
    public void sendHeartbeat() {
        for (EmitterInfo info : allEmitters) {
            try {
                info.emitter.send(SseEmitter.event()
                    .name("heartbeat")
                    .data(Map.of("timestamp", System.currentTimeMillis())));
            } catch (IOException e) {
                log.debug("Heartbeat failed for {}: {}", info.machineId, e.getMessage());
            }
        }
    }

    /**
     * Broadcast a file upload notification to all connected clients EXCEPT the origin machine.
     */
    public void broadcastFileUpload(String entityType, Long entityId, String fileName,
                                     Long fileId, String originMachineId) {
        int sentCount = 0;
        int failCount = 0;

        for (EmitterInfo info : allEmitters) {
            if (info.machineId.equals(originMachineId)) {
                continue;
            }

            try {
                info.emitter.send(SseEmitter.event()
                    .name("file_upload")
                    .data(Map.of(
                        "entityType", entityType,
                        "entityId", entityId,
                        "fileName", fileName,
                        "fileId", fileId,
                        "originMachineId", originMachineId,
                        "timestamp", System.currentTimeMillis()
                    )));
                sentCount++;
            } catch (IOException e) {
                failCount++;
                log.debug("Failed to send file_upload notification to {} ({}): {}",
                    info.machineName, info.machineId, e.getMessage());
            }
        }

        if (sentCount > 0 || failCount > 0) {
            log.info("Broadcast file_upload for {}/{} ({}) to {} clients ({} failed)",
                entityType, entityId, fileName, sentCount, failCount);
        }
    }

    public int getConnectionCount() {
        return allEmitters.size();
    }

    public int getUniqueMachineCount() {
        return emittersByMachine.size();
    }

    public boolean isMachineConnected(String machineId) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByMachine.get(machineId);
        return emitters != null && !emitters.isEmpty();
    }

    private static class EmitterInfo {
        final String machineId;
        final String machineName;
        final SseEmitter emitter;

        EmitterInfo(String machineId, String machineName, SseEmitter emitter) {
            this.machineId = machineId;
            this.machineName = machineName;
            this.emitter = emitter;
        }
    }
}
