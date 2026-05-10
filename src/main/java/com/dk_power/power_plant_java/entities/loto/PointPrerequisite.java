package com.dk_power.power_plant_java.entities.loto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Per-LOTO-point prerequisite spec. Stored as JSON inside the parent's
 * {@code pointPrerequisitesJson} column (one entry per pointId).
 *
 * <p>Two kinds of prerequisites are supported:
 * <ul>
 *   <li>{@link #requiredPointIds} — other LOTO points that must be marked hung
 *       before this one can be marked hung. Drives sequencing.
 *   <li>{@link #safetyConditions} — free-text safety checks the operator must
 *       confirm before hanging this point (e.g. "MOV must be open").
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PointPrerequisite {
    private List<Long> requiredPointIds = new ArrayList<>();
    private List<String> safetyConditions = new ArrayList<>();

    /** Free-text instructions the operator follows when hanging this point. */
    private String installNotes;

    /** Free-text instructions the operator follows when removing this point. */
    private String removalNotes;

    /**
     * Optional explicit removal-order rank for this point. Lower numbers come first.
     * When null on every point, the UI/automation falls back to reverse-of-install order.
     */
    private Integer removalOrder;
}

