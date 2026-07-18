package com.dk_power.power_plant_java.entities.sync;

/** How a row diverges from a {@link DriftPeer} (the hub or SharePoint). Peer-relative, not hub-specific. */
public enum DriftKind {
    /** Present on both sides but the compared content differs (the case a count/timestamp check misses). */
    DIFFERING,
    /** On the peer, absent locally — Accept Remote pulls it in. */
    MISSING_LOCALLY,
    /** Local, absent on the peer — Accept Local pushes it up. */
    MISSING_ON_PEER
}
