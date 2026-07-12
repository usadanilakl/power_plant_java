package com.dk_power.power_plant_java.entities.rounds;

/** State of an out-of-range issue (persists across rounds until the reading returns to normal). */
public enum RoundIssueStatus {
    OPEN,
    RESOLVED
}
