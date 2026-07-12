package com.dk_power.power_plant_java.entities.rounds;

/** How a round question is answered (drives the mobile input control + out-of-range logic). */
public enum RoundAnswerType {
    /** Numeric reading with a unit; out-of-range checked against low/high limits. */
    READING,
    /** Pass/fail (or yes/no); "abnormal" checked against the expected value. */
    PASS_FAIL,
    /** Free text. */
    TEXT,
    /** One-of a fixed choice list. */
    CHOICE,
    /** A selector like Day/Night (informational; not issue-tracked). */
    SELECTOR
}
