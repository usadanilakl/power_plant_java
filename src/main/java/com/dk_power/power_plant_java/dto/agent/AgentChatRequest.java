package com.dk_power.power_plant_java.dto.agent;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AgentChatRequest {
    private String sessionId;
    private String message;
    private String confirmationId;
    private boolean confirmed;
}
