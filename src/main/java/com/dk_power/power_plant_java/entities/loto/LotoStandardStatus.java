package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.categories.Value;

import java.util.Set;

/**
 * Canonical status names for {@link LotoStandard} development. Stored as
 * {@link Value} entries under category {@link #CATEGORY}, but the names below
 * are authoritative — the {@code Value} rows are seeded from these.
 */
public final class LotoStandardStatus {
    public static final String CATEGORY = "Loto Standard Status";

    public static final String DRAFT = "Draft";
    public static final String PENDING_VERIFICATION = "Pending Verification";
    public static final String VERIFIED = "Verified";
    public static final String WALKDOWN_COMPLETE = "Walkdown Complete";
    public static final String READY_FOR_TESTING = "Ready For Testing";
    public static final String APPROVED = "Approved";
    public static final String NEW_PENDING_REAPPROVAL = "New - Pending Reapproval";

    public static final Set<String> ALL = Set.of(
            DRAFT, PENDING_VERIFICATION, VERIFIED, WALKDOWN_COMPLETE,
            READY_FOR_TESTING, APPROVED, NEW_PENDING_REAPPROVAL
    );

    /**
     * FSM. Allowed target statuses for a given current status. APPROVED is
     * terminal in the forward direction — modifications kick it to
     * NEW_PENDING_REAPPROVAL via the modification hook, not via this map.
     */
    public static Set<String> allowedTargets(String current) {
        if (current == null) return Set.of(DRAFT);
        return switch (current) {
            case DRAFT -> Set.of(PENDING_VERIFICATION);
            case PENDING_VERIFICATION -> Set.of(VERIFIED, DRAFT);
            case VERIFIED -> Set.of(WALKDOWN_COMPLETE, DRAFT);
            case WALKDOWN_COMPLETE -> Set.of(READY_FOR_TESTING, DRAFT);
            case READY_FOR_TESTING -> Set.of(APPROVED, DRAFT);
            case APPROVED -> Set.of();
            case NEW_PENDING_REAPPROVAL -> Set.of(PENDING_VERIFICATION, DRAFT);
            default -> Set.of();
        };
    }

    /** Returns true if status name is a recognised standard status. */
    public static boolean isValid(String status) {
        return status != null && ALL.contains(status);
    }

    private LotoStandardStatus() {}
}
