package com.dk_power.power_plant_java.sevice.automation.redtag.session;

/** Lifecycle state of an automation session (a whole build run). */
public enum SessionStatus {
    IDLE,
    RUNNING,
    PAUSED,
    COMPLETED,
    FAILED
}
