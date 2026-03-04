package com.dk_power.power_plant_java.controller.angular.agent;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.agent.AgentChatRequest;
import com.dk_power.power_plant_java.dto.agent.AgentChatResponse;
import com.dk_power.power_plant_java.sevice.agent.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ng/agent")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "gemini.api.key")
public class NgAgentController {

    private final GeminiService geminiService;

    @PostMapping("/chat")
    public ResponseEntity<NgApiResponse<AgentChatResponse>> chat(@RequestBody AgentChatRequest request) {
        try {
            AgentChatResponse response;
            if (request.getConfirmationId() != null && !request.getConfirmationId().isBlank()) {
                response = geminiService.handleConfirmation(request.getSessionId(), request.isConfirmed());
            } else {
                response = geminiService.chat(request.getSessionId(), request.getMessage());
            }
            return ResponseEntity.ok(new NgApiResponse<>(response, "OK"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<NgApiResponse<Boolean>> getStatus() {
        return ResponseEntity.ok(new NgApiResponse<>(true, "Agent is available"));
    }

    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<NgApiResponse<Void>> clearSession(@PathVariable String sessionId) {
        geminiService.clearSession(sessionId);
        return ResponseEntity.ok(new NgApiResponse<>(null, "Session cleared"));
    }
}
