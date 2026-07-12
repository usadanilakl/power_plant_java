package com.dk_power.power_plant_java.entities.rounds;

/** Lifecycle of a performed round. */
public enum RoundInstanceStatus {
    /** Grabbed / in progress (reserved by an operator). */
    IN_PROGRESS,
    /** Answers submitted and reconciled (issues opened/attached/resolved). */
    SUBMITTED
}
