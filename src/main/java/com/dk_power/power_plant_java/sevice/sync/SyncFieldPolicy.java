package com.dk_power.power_plant_java.sevice.sync;

import java.util.Map;
import java.util.Set;

/**
 * Apply-side denylist for CRDT field changes: {@code entityType.fieldName} pairs that a node must
 * NEVER write from an inbound {@link com.dk_power.power_plant_java.entities.sync.FieldChange},
 * however that change arrives.
 *
 * <p><b>Why this exists.</b> {@code FieldSyncService.applyFieldChange} looks a field up BY NAME from
 * the incoming change and reflectively {@code field.set}s it — with no check on which field it is
 * and no authentication of the change's origin. {@code User} is a synced entity, so a forged or
 * corrupted change {@code {User, role, "ROLE_ADMIN"}} (or a new password hash) would be applied on
 * every node. Nodes trust any change that arrives; there is no per-change signature. That unsigned-
 * origin weakness is the ROOT problem and is NOT fixed here — see the note below.
 *
 * <p><b>Scope of this denylist (deliberately narrow).</b> It blocks only auth-adjacent fields that
 * are forgeable AND that <i>no node legitimately depends on receiving</i>, so blocking them breaks
 * nothing:
 * <ul>
 *   <li>{@code failedPinAttempts} / {@code pinLockedUntil} — per-node step-up throttle/lockout
 *       state. Each node maintaining its own is correct; a forged reset would clear the brute-force
 *       guard fleet-wide.</li>
 *   <li>{@code supabaseUuid} / {@code pwaUserUuid} — identity-binding UUIDs written ONLY by direct
 *       hub-side JPA saves (SupabaseReconciliationService / SyncAtLoginService / PWA registration),
 *       never through the apply path, and read only on the hub. A forged inbound value could
 *       repoint an admin's Supabase/PWA identity; blocking inbound applies costs nothing because the
 *       legitimate write does not use this path.</li>
 * </ul>
 *
 * <p><b>What this does NOT cover, on purpose.</b> {@code role}, {@code password}, {@code isActive},
 * {@code permissionLevel}, {@code email}, {@code pinHash}, {@code signingInitials},
 * {@code windowsUsername} are ALSO forgeable and higher-value — but CRDT sync is their ONLY
 * cross-node propagation channel (desktop auto-auth and RBAC read the replicated values directly,
 * see {@code DesktopAutoAuthFilter}). Denylisting them would break real workflows (an admin's role
 * change would stop reaching other desktops; a synced user could not log in on a second desktop; a
 * deactivation would not lock a user out fleet-wide). The correct fix for those is authenticating
 * the ORIGIN of a FieldChange (sign on emit, verify on apply), not dropping the field. Tracked
 * separately in the security remediation plan.
 */
public final class SyncFieldPolicy {

    private SyncFieldPolicy() {}

    /** entityType -> field names that must never be written from an inbound change. */
    private static final Map<String, Set<String>> DENIED = Map.of(
        "User", Set.of(
            "failedPinAttempts",
            "pinLockedUntil",
            "supabaseUuid",
            "pwaUserUuid"
        )
    );

    /**
     * @param entityType the change's entity type (e.g. {@code "User"})
     * @param fieldName  the Java field name emitted by the tracker (e.g. {@code "supabaseUuid"}),
     *                   NOT the DB column name
     * @return true if this field must not be applied from an inbound sync change
     */
    public static boolean isDenied(String entityType, String fieldName) {
        if (entityType == null || fieldName == null) return false;
        Set<String> fields = DENIED.get(entityType);
        return fields != null && fields.contains(fieldName);
    }
}
