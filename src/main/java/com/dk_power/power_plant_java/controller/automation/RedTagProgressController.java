package com.dk_power.power_plant_java.controller.automation;

import com.dk_power.power_plant_java.dto.automation.AutomationSessionState;
import com.dk_power.power_plant_java.dto.automation.AutomationStep;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/red-tag-progress")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RedTagProgressController {

    private final ObjectMapper objectMapper;
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        log.info("Red Tag SSE client connected. Total: {}", emitters.size());

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            log.warn("Failed to send connection confirmation: {}", e.getMessage());
        }

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.info("Red Tag SSE client disconnected (completion). Total: {}", emitters.size());
        });
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            log.info("Red Tag SSE client disconnected (timeout). Total: {}", emitters.size());
        });
        emitter.onError((ex) -> {
            emitters.remove(emitter);
            log.info("Red Tag SSE client disconnected (error). Total: {}", emitters.size());
        });

        return emitter;
    }

    public void broadcastSessionState(String eventName, AutomationSessionState state) {
        if (emitters.isEmpty()) return;
        try {
            String json = objectMapper.writeValueAsString(state);
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name(eventName).data(json));
                } catch (IOException e) {
                    emitters.remove(emitter);
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting session state: {}", e.getMessage());
        }
    }

    public void broadcastStepUpdate(AutomationStep step) {
        if (emitters.isEmpty()) return;
        try {
            String json = objectMapper.writeValueAsString(step);
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name("step_update").data(json));
                } catch (IOException e) {
                    emitters.remove(emitter);
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting step update: {}", e.getMessage());
        }
    }
}
