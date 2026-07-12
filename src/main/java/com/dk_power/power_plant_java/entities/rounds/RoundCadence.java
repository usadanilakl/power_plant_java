package com.dk_power.power_plant_java.entities.rounds;

/** How often a round comes due (native scheduling; the due-computation lives in the schedule service). */
public enum RoundCadence {
    PER_SHIFT,
    DAILY,
    WEEKLY,
    MONTHLY,
    CUSTOM
}
