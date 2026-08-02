package com.dk_power.power_plant_java.entities.users;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_password_updated_at", columnList = "password_updated_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@BatchSize(size = 50)
@Where(clause = "deleted IS NOT TRUE")
public class User extends BaseAuditEntity {

    @Column(name = "username")
    private String username;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "name")
    private String name;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "role")
    private String role;

    @Column(name = "password")
    private String password;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    @Column(name = "windows_username")
    private String windowsUsername;

    /**
     * Explicit Maximo personid override. Null/blank = derive from {@link #windowsUsername}
     * (plant convention: Maximo personid is the uppercased Windows account). Set this only
     * for the few users whose Maximo identity diverges from their Windows login. Read the
     * effective value via {@link #getMaximoPersonid()} — never this field directly.
     */
    @Column(name = "maximo_personid")
    private String maximoPersonidOverride;

    /**
     * The exact name as it appears in the SharePoint Ops Schedule (e.g. "Danil", "Andy G"). Used to
     * resolve schedule roster entries to this user — set it for lead operators so PM auto-assignment
     * targets the right person. Matched case-insensitively; takes priority over fuzzy name matching.
     */
    @Column(name = "schedule_name")
    private String scheduleName;

    @Column(name = "phone")
    private String phone;

    @Column(name = "secondary_phone")
    private String secondaryPhone;

    @Column(name = "title")
    private String title;

    @Column(name = "emergency_contact_json", columnDefinition = "TEXT")
    private String emergencyContactJson;

    @Column(name = "company")
    private String company;

    @Column(name = "pwa_user_uuid", unique = true)
    private String pwaUserUuid;

    // ── Dual-authority auth (Hub + Supabase) — see project/features/users/dual-auth.md ──

    /**
     * This user's id in the Supabase secondary auth store (auth.users.id). Null until the user is
     * provisioned/mirrored into Supabase. Populated by the bulk-provisioning job, by the Supabase
     * mirror on registration, or by sync-at-login when Supabase first sees this user.
     */
    @Column(name = "supabase_uuid", unique = true)
    private String supabaseUuid;

    /**
     * UTC timestamp of the most recent password change on the hub side. Compared against Supabase's
     * {@code password_updated_at} to decide last-writer-wins direction during sync-at-login
     * reconciliation. Set whenever {@link #password} changes.
     */
    @Column(name = "password_updated_at")
    private LocalDateTime passwordUpdatedAt;

    /** OnLocation member id (sp/member.id) — stable key used to upsert contractor rows. */
    @Column(name = "on_location_member_id", unique = true)
    private String onLocationMemberId;

    @Column(name = "permission_level")
    private String permissionLevel;

    @Column(name = "signature_path")
    private String signaturePath;

    @Column(name = "last_notification_check")
    private LocalDateTime lastNotificationCheck;

    // ── PIN authentication (see project/features/users/pin-authentication.md) ──

    /** 2-character (or short) prefix the user types before their 4-digit PIN. */
    @Column(name = "signing_initials", length = 8)
    private String signingInitials;

    /** BCrypt hash of the 4-digit PIN. Null when no PIN has been set. */
    @Column(name = "pin_hash")
    private String pinHash;

    /** Last time the user set their PIN. */
    @Column(name = "pin_set_at")
    private LocalDateTime pinSetAt;

    /** Account locked for PIN-based step-up until this timestamp; null when not locked. */
    @Column(name = "pin_locked_until")
    private LocalDateTime pinLockedUntil;

    /** Consecutive failed PIN attempts; reset to 0 on success. */
    @Column(name = "failed_pin_attempts")
    private Integer failedPinAttempts;

    /**
     * When the user requested a PIN reset (because they forgot it). Null when no
     * pending request. Cleared when admin resets the PIN (issuing a new one), so
     * an outstanding flag is always actionable.
     */
    @Column(name = "pin_reset_requested_at")
    private LocalDateTime pinResetRequestedAt;

    /**
     * True when the current PIN was admin-issued (initial assignment or reset)
     * and the user hasn't changed it themselves yet. The profile UI surfaces a
     * banner urging them to change it; once they do, the flag clears.
     */
    @lombok.Builder.Default
    @Column(name = "pin_must_change")
    private Boolean pinMustChange = Boolean.FALSE;

    /**
     * Per-user revocation nonce for the long-lived iCal subscription token (see
     * {@code JwtService#generateIcalToken}/{@code verifyIcalTokenClaims}). Bumping this value
     * invalidates every calendar URL issued to this user so far ("regenerate my calendar link")
     * without a fleet-wide hub JWT key rotation. Tokens minted before this field existed carry no
     * {@code tokenVersion} claim — treated as version 0, matching this default, so existing live
     * subscription links keep working.
     */
    @lombok.Builder.Default
    @Column(name = "ical_token_version")
    private Integer icalTokenVersion = 0;

    /** Most recent safety-training completion timestamp. */
    @Column(name = "training_completed_at")
    private LocalDateTime trainingCompletedAt;

    /** When the current safety training expires (typically completed + 1 year). */
    @Column(name = "training_expires_at")
    private LocalDateTime trainingExpiresAt;

    /** Returns roles as a list (comma-separated storage in `role` column). */
    public List<String> getRoles() {
        if (role == null || role.isBlank()) return Collections.emptyList();
        return Arrays.stream(role.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** Sets roles from a list (stored comma-separated). */
    public void setRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            this.role = "";
        } else {
            this.role = String.join(",", roles);
        }
    }

    /** Check if user has a specific role. */
    public boolean hasRole(String roleName) {
        if (role == null || roleName == null) return false;
        return getRoles().stream().anyMatch(r -> r.equalsIgnoreCase(roleName));
    }

    /** Add a role (no duplicates). */
    public void addRole(String roleName) {
        List<String> current = new java.util.ArrayList<>(getRoles());
        if (current.stream().noneMatch(r -> r.equalsIgnoreCase(roleName))) {
            current.add(roleName);
            setRoles(current);
        }
    }

    /** Check if user holds a specific LOTO role. */
    public boolean hasLotoRole(LotoRole lotoRole) {
        return lotoRole != null && hasRole(lotoRole.roleName());
    }

    /**
     * This user's identity in Maximo (e.g. value of `spi:lead` on a work order).
     * Prefers the explicit {@link #maximoPersonidOverride} when set; otherwise falls back
     * to the uppercased {@link #windowsUsername} — plant convention is that Maximo personids
     * are domain usernames in uppercase. Always returned uppercase so callers can compare
     * against Maximo without re-normalizing.
     *
     * <p>The raw stored override is {@code maximoPersonidOverride} (Lombok accessors
     * {@code getMaximoPersonidOverride()}/{@code setMaximoPersonidOverride()}); this resolver
     * has a deliberately distinct name so it is never confused for that field's accessor by
     * the mapper.
     */
    @Transient
    public String getMaximoPersonid() {
        if (maximoPersonidOverride != null && !maximoPersonidOverride.isBlank()) {
            return maximoPersonidOverride.trim().toUpperCase();
        }
        return windowsUsername == null ? null : windowsUsername.trim().toUpperCase();
    }
}