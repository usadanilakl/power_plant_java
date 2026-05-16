package com.dk_power.power_plant_java.entities.loto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Per-LOTO-point prerequisite spec. Stored as JSON inside the parent's
 * {@code pointPrerequisitesJson} column (one entry per pointId).
 *
 * <p>Install and removal sides are stored independently. When a removal-side
 * collection is empty/null, the runtime falls back to the install-side value
 * (treated as "removal follows install" by default). The standard's UI offers
 * a one-click "Reverse for removal" action that materializes the reversed
 * predecessor graph into {@link #removalRequiredPointIds}.
 *
 * <p>Backwards-compatible Jackson aliases ({@code requiredPointIds},
 * {@code safetyConditions}) ensure old JSON snapshots deserialize into the
 * install-side fields.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PointPrerequisite {

    // ---- Install side ----
    /** Points that must be hung before this point. */
    @JsonAlias({"requiredPointIds"})
    private List<Long> installRequiredPointIds = new ArrayList<>();

    /** Safety conditions the operator must acknowledge before hanging. */
    @JsonAlias({"safetyConditions"})
    private List<String> installSafetyConditions = new ArrayList<>();

    /** Free-text instructions the operator follows when hanging this point. */
    private String installNotes;

    // ---- Removal side ----
    /** Points that must be removed before this point. Empty = inherit install. */
    private List<Long> removalRequiredPointIds = new ArrayList<>();

    /** Safety conditions the operator must acknowledge before removal. Empty = inherit install. */
    private List<String> removalSafetyConditions = new ArrayList<>();

    /** Free-text instructions the operator follows when removing this point. */
    private String removalNotes;

    /**
     * Optional explicit removal-order rank for this point. Lower numbers come first.
     * When null on every point, the UI/automation falls back to install order
     * (per the standard's removal default; see standard-level reverse toggle).
     */
    private Integer removalOrder;

    // ---- Effective-removal helpers (fall back to install when removal is empty) ----

    public List<Long> effectiveRemovalRequiredPointIds() {
        if (removalRequiredPointIds != null && !removalRequiredPointIds.isEmpty()) return removalRequiredPointIds;
        return installRequiredPointIds != null ? installRequiredPointIds : new ArrayList<>();
    }

    public List<String> effectiveRemovalSafetyConditions() {
        if (removalSafetyConditions != null && !removalSafetyConditions.isEmpty()) return removalSafetyConditions;
        return installSafetyConditions != null ? installSafetyConditions : new ArrayList<>();
    }
}
