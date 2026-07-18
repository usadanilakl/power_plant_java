package com.dk_power.power_plant_java.entities.sync;

/** The authority a local row is compared against. A row can drift against either independently. */
public enum DriftPeer {
    /** The central hub — detected by the content-hash oracle (accurate field-level value drift). */
    HUB,
    /** SharePoint — only for SP-backed entity types; detected via the 3-way verification. */
    SHAREPOINT
}
