package com.dk_power.power_plant_java.sevice.automation.redtag.statesync;

import com.dk_power.power_plant_java.sevice.automation.redtag.core.RedTagPattern;

/**
 * The four Red-Tag-side LOTO statuses that the state-sync flow can pull.
 *
 * <p>Each status carries pointers to its two tab-strip crops in
 * {@link RedTagPattern}:
 * <ul>
 *   <li>{@link #collapsedPattern()} — status label in its collapsed state
 *       (rows hidden; double-clicked at its centre to expand);</li>
 *   <li>{@link #expandedPattern()} — status label in its expanded state
 *       (rows visible; used to confirm the double-click landed).</li>
 * </ul>
 *
 * <p>{@link #localPermitStatus()} maps a Red-Tag status onto the local
 * {@code permitStatus.name} (Building / Active / Test / Closed) that the
 * reconciler will bring a matched local LOTO into. Statuses without a
 * meaningful local counterpart return {@code null} — the reconciler treats
 * those as "no state change needed on match" and only creates / closes on
 * presence differences.
 */
public enum RedTagStatus {

    ACTIVE(
            RedTagPattern.LIST_STATUS_ACTIVE_COLLAPSED,
            RedTagPattern.LIST_STATUS_ACTIVE_EXPANDED,
            "Active"),
    INACTIVE(
            RedTagPattern.LIST_STATUS_INACTIVE_COLLAPSED,
            RedTagPattern.LIST_STATUS_INACTIVE_EXPANDED,
            // Inactive on the RT side is a LOTO the crew has stepped away from
            // but not closed. Locally that maps to Building — the same permit
            // is still open for edits before the next activation.
            "Building"),
    CANCELED(
            RedTagPattern.LIST_STATUS_CANCELED_COLLAPSED,
            RedTagPattern.LIST_STATUS_CANCELED_EXPANDED,
            "Closed"),
    CLOSED(
            RedTagPattern.LIST_STATUS_CLOSED_COLLAPSED,
            RedTagPattern.LIST_STATUS_CLOSED_EXPANDED,
            "Closed");

    private final RedTagPattern collapsedPattern;
    private final RedTagPattern expandedPattern;
    private final String localPermitStatus;

    RedTagStatus(RedTagPattern collapsedPattern, RedTagPattern expandedPattern,
                 String localPermitStatus) {
        this.collapsedPattern = collapsedPattern;
        this.expandedPattern = expandedPattern;
        this.localPermitStatus = localPermitStatus;
    }

    public RedTagPattern collapsedPattern() { return collapsedPattern; }
    public RedTagPattern expandedPattern() { return expandedPattern; }
    public String localPermitStatus() { return localPermitStatus; }

    /** Case-insensitive parse — accepts "active", "ACTIVE", "Active", etc. */
    public static RedTagStatus parse(String s) {
        if (s == null) return null;
        for (RedTagStatus rs : values()) {
            if (rs.name().equalsIgnoreCase(s.trim())) return rs;
        }
        throw new IllegalArgumentException("Unknown Red Tag status: " + s
                + " — expected one of ACTIVE / INACTIVE / CANCELED / CLOSED");
    }
}
