package com.dk_power.power_plant_java.sevice.pwa;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Manages SSE connections for PWA users (contractors).
 * Each user (identified by email) can have multiple connections (multiple tabs/devices).
 */
@Service
@Slf4j
public class PwaSseService {

    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emittersByEmail = new ConcurrentHashMap<>();

    private static final long SSE_TIMEOUT_MS = 10 * 60 * 1000L; // 10 minutes

    public SseEmitter createEmitter(String userEmail) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        emittersByEmail.computeIfAbsent(userEmail, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> removeEmitter(userEmail, emitter);

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> {
            log.debug("[PWA SSE] Error for {}: {}", userEmail, e.getMessage());
            cleanup.run();
        });

        // Send connection confirmation
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("message", "Connected to permit notifications")));
        } catch (IOException e) {
            log.warn("[PWA SSE] Failed to send connection confirmation to {}: {}", userEmail, e.getMessage());
            removeEmitter(userEmail, emitter);
        }

        log.info("[PWA SSE] Connection established for {}. Total users: {}", userEmail, emittersByEmail.size());
        return emitter;
    }

    /**
     * Send a permit notification to a specific user by email.
     */
    public void sendToUser(String userEmail, String eventName, Map<String, Object> data) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByEmail.get(userEmail);
        if (emitters == null || emitters.isEmpty()) return;

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException e) {
                log.debug("[PWA SSE] Failed to send {} to {}, removing dead emitter: {}", eventName, userEmail, e.getMessage());
                removeEmitter(userEmail, emitter);
            }
        }
    }

    /**
     * Send heartbeat to all connected PWA users every 30 seconds.
     */
    @Scheduled(fixedDelay = 30000)
    public void sendHeartbeat() {
        for (var entry : emittersByEmail.entrySet()) {
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("heartbeat")
                            .data(Map.of("timestamp", System.currentTimeMillis())));
                } catch (IOException e) {
                    log.debug("[PWA SSE] Heartbeat failed for {}, removing dead emitter: {}", entry.getKey(), e.getMessage());
                    removeEmitter(entry.getKey(), emitter);
                }
            }
        }
    }

    private void removeEmitter(String userEmail, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByEmail.get(userEmail);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                emittersByEmail.remove(userEmail);
            }
        }
        log.debug("[PWA SSE] Emitter removed for {}", userEmail);
    }

    public int getConnectionCount() {
        return emittersByEmail.values().stream().mapToInt(CopyOnWriteArrayList::size).sum();
    }

    public boolean isUserConnected(String userEmail) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByEmail.get(userEmail);
        return emitters != null && !emitters.isEmpty();
    }
}
