package com.dk_power.power_plant_java.dto.pwa;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Compact per-row drift signal for the PWA field-list list view. Booleans only — the PWA
 * shows a badge and a short tooltip; it does NOT resolve drift (admin/plant-user surface).
 * Reasoning: field workers should KNOW something is out of sync so they can escalate, but
 * fixing it belongs in JG Portal's admin drift panel (has retry/accept actions).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PwaFieldListDriftStatusDto {
    /** Local ROW record vs hub CRDT content-hash oracle differs, OR row missing from either side. */
    private boolean hubDrift;
    /** Local row is missing from SharePoint (row-presence drift; field-value drift is drill-down only). */
    private boolean spDrift;
    /** Maximo bridge action is pending (submit / cancel / complete). Not the same as drift — a stuck bridge call. */
    private boolean maximoPending;
    /** Local status is one of {"Open","In Progress"} but Maximo is at a terminal status. */
    private boolean maximoClosedLocalOpen;
    /** Local status is Closed but Maximo WO is still open. */
    private boolean localClosedMaximoOpen;
}
