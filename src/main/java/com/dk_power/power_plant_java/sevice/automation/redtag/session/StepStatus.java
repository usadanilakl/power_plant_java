package com.dk_power.power_plant_java.sevice.automation.redtag.session;

/** Lifecycle state of a single automation step. */
public enum StepStatus {
    PENDING,
    RUNNING,
    SUCCESS,
    FAILED,
    SKIPPED
}
