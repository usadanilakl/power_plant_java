package com.dk_power.power_plant_java.sevice.agent;

import com.dk_power.power_plant_java.dto.agent.AgentChatResponse.PendingAction;
import com.google.genai.types.Content;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@ConditionalOnProperty(name = "gemini.api.key")
public class AgentSessionManager {

    private final Map<String, List<Content>> conversationHistory = new ConcurrentHashMap<>();
    private final Map<String, PendingAction> pendingActions = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> pendingActionArgs = new ConcurrentHashMap<>();

    public String createSession() {
        String sessionId = UUID.randomUUID().toString();
        conversationHistory.put(sessionId, new ArrayList<>());
        log.info("[Agent] Created session {}", sessionId);
        return sessionId;
    }

    public List<Content> getHistory(String sessionId) {
        return conversationHistory.computeIfAbsent(sessionId, k -> new ArrayList<>());
    }

    public void addToHistory(String sessionId, Content content) {
        getHistory(sessionId).add(content);
    }

    public void storePendingAction(String sessionId, PendingAction action, Map<String, Object> args) {
        pendingActions.put(sessionId, action);
        pendingActionArgs.put(sessionId, args);
    }

    public PendingAction getPendingAction(String sessionId) {
        return pendingActions.get(sessionId);
    }

    public Map<String, Object> getPendingActionArgs(String sessionId) {
        return pendingActionArgs.get(sessionId);
    }

    public void clearPendingAction(String sessionId) {
        pendingActions.remove(sessionId);
        pendingActionArgs.remove(sessionId);
    }

    public void clearSession(String sessionId) {
        conversationHistory.remove(sessionId);
        pendingActions.remove(sessionId);
        pendingActionArgs.remove(sessionId);
        log.info("[Agent] Cleared session {}", sessionId);
    }
}
