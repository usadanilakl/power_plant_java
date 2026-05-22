package com.dk_power.power_plant_java.sevice.automation.redtag.session;

import lombok.Getter;
import lombok.Setter;

/**
 * One unit of automation work (e.g. "Open LOTO Builder", "Add LOTO Points").
 *
 * <p>The JSON shape is intentionally identical to the legacy
 * {@code dto.automation.AutomationStep} so the existing Angular progress UI
 * can consume this new engine without changes.
 */
@Getter
@Setter
public class AutomationStep {

    private int index;
    private String id;
    private String name;
    private String category;
    private StepStatus status = StepStatus.PENDING;
    private String errorMessage;
    private long startTimeMs;
    private long endTimeMs;
    private String permitType;
    private Long permitId;

    public AutomationStep() {
    }

    public AutomationStep(int index, String id, String name, String category) {
        this.index = index;
        this.id = id;
        this.name = name;
        this.category = category;
    }

    public AutomationStep(int index, String id, String name, String category,
                          String permitType, Long permitId) {
        this(index, id, name, category);
        this.permitType = permitType;
        this.permitId = permitId;
    }
}
