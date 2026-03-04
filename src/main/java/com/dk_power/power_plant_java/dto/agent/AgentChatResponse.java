package com.dk_power.power_plant_java.dto.agent;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class AgentChatResponse {
    private String sessionId;
    private String message;
    private String type; // "text", "search_results", "confirmation_required", "action_completed", "error"
    private Map<String, Object> data;
    private String confirmationId;
    private PendingAction pendingAction;

    @Getter
    @Setter
    public static class PendingAction {
        private String actionName;
        private String description;
        private Map<String, Object> parameters;
    }

    public static AgentChatResponse text(String sessionId, String message) {
        AgentChatResponse r = new AgentChatResponse();
        r.setSessionId(sessionId);
        r.setType("text");
        r.setMessage(message);
        return r;
    }

    public static AgentChatResponse error(String sessionId, String message) {
        AgentChatResponse r = new AgentChatResponse();
        r.setSessionId(sessionId);
        r.setType("error");
        r.setMessage(message);
        return r;
    }
}
