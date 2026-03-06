package com.dk_power.power_plant_java.dto.automation;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class AutomationSessionState {
    private String sessionId = UUID.randomUUID().toString();
    private Long packageId;
    private String packageName;
    private List<AutomationStep> steps = new ArrayList<>();
    private int currentStepIndex = -1;
    private SessionStatus status = SessionStatus.IDLE;
    private long startTimeMs;
    private long lastUpdateMs;
}
