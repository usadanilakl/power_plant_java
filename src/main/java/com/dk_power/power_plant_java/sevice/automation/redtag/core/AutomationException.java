package com.dk_power.power_plant_java.sevice.automation.redtag.core;

/**
 * Single typed failure for the Red Tag automation.
 *
 * <p>Replaces the legacy mix of {@code FindFailed}, {@code RuntimeException} and
 * stringly-typed {@code "Failed ..."} return values. Every layer throws this so
 * the {@code StepEngine} can render one consistent, user-readable message.
 */
public class AutomationException extends RuntimeException {

    /** Logical pattern name involved in the failure, when applicable. */
    private final String patternName;

    public AutomationException(String message) {
        super(message);
        this.patternName = null;
    }

    public AutomationException(String message, Throwable cause) {
        super(message, cause);
        this.patternName = null;
    }

    public AutomationException(String message, String patternName, Throwable cause) {
        super(message, cause);
        this.patternName = patternName;
    }

    public String getPatternName() {
        return patternName;
    }
}
