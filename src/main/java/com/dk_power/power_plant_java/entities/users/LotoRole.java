package com.dk_power.power_plant_java.entities.users;

/**
 * Roles that gate LOTO procedure transitions. Stored as strings in
 * {@link User#role} (comma-separated). Matched case-insensitively.
 */
public enum LotoRole {
    // ── New canonical roles ───────────────────────────────────────────────
    /**
     * Control Authority — develops/verifies/walks-down standards, issues LOTO
     * permits, approves for hanging, hangs, verifies, can be requestor,
     * activates, pauses (Test), modifies, releases, closes.
     */
    CONTROL_AUTHORITY,
    /** Can hang and verify LOTO points (per-point + aggregate). */
    LOTO_QUALIFIED,
    /** Can be a LOTO permit requestor (initiate transfer, accept, release-as-requestor). */
    REQUESTOR,
    /** Approves a completed standard after testing — final development gate. */
    MANAGER,

    // ── Legacy role names (kept for back-compat with existing user data) ──
    /** @deprecated retained for legacy user data; use {@link #LOTO_QUALIFIED}. */
    AFFECTED,
    /** @deprecated retained for legacy user data; treated as LOTO_QUALIFIED. */
    AUTHORIZED,
    /** @deprecated retained for legacy user data; treated as CONTROL_AUTHORITY. */
    QUALIFIED;

    public String roleName() {
        return name();
    }
}
