package com.dk_power.power_plant_java.entities.users;

/**
 * Roles that gate LOTO procedure transitions. Stored as strings in
 * {@link User#role} (comma-separated). Matched case-insensitively.
 */
public enum LotoRole {
    /** Allowed to work under LOTO; cannot perform development or hanging. */
    AFFECTED,
    /** Hanger / Verifier — can hang and verify LOTO instances. */
    AUTHORIZED,
    /** Performs electrical equipment LOTO and develops/verifies standards. */
    QUALIFIED,
    /** Approves completed standards (final development gate). */
    MANAGER;

    public String roleName() {
        return name();
    }
}
