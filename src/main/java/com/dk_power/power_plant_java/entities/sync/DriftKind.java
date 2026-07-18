package com.dk_power.power_plant_java.entities.sync;

/** How a row diverges from the hub, per the content-hash drift oracle. */
public enum DriftKind {
    /** Present on both sides but the synced-field content differs (the case a count/timestamp check misses). */
    DIFFERING,
    /** On the hub, absent locally — Accept Remote pulls it in. */
    MISSING_LOCALLY,
    /** Local, absent on the hub — Accept Local pushes it up. */
    MISSING_ON_HUB
}
