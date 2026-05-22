package com.dk_power.power_plant_java.sevice.automation.redtag.session;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A whole automation run: an ordered list of {@link AutomationStep}s plus
 * progress/status. JSON-compatible with the legacy {@code AutomationSessionState}.
 */
@Getter
@Setter
public class AutomationSession {

    private String sessionId = UUID.randomUUID().toString();
    /** ID of the entity that triggered the build (the LOTO id, for a LOTO build). */
    private Long packageId;
    private String packageName;
    private List<AutomationStep> steps = new ArrayList<>();
    private int currentStepIndex = -1;
    private SessionStatus status = SessionStatus.IDLE;
    private long startTimeMs;
    private long lastUpdateMs;
}
