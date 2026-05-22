package com.dk_power.power_plant_java.sevice.automation.redtag.progress;

import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationSession;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationStep;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Pushes live automation progress to connected browsers over Server-Sent Events.
 *
 * <p>Event names match what the Angular progress UI already listens for
 * ({@code session_started}, {@code session_paused}, {@code step_update}, ...),
 * so the front end stays compatible with this new engine.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RedTagProgressBroadcaster {

    private final ObjectMapper objectMapper;
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /** Registers a freshly opened SSE connection and wires up its cleanup. */
    public SseEmitter register() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(ex -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
        log.info("[RedTag] Progress client connected. Total: {}", emitters.size());
        return emitter;
    }

    /** Broadcasts a whole-session event (started, paused, complete, ...). */
    public void session(String eventName, AutomationSession session) {
        send(eventName, session);
    }

    /** Broadcasts a single-step update. */
    public void step(AutomationStep step) {
        send("step_update", step);
    }

    private void send(String eventName, Object payload) {
        if (emitters.isEmpty()) return;
        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("[RedTag] Failed to serialise progress event '{}': {}", eventName, e.getMessage());
            return;
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(json));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}
