package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient.SupabaseUser;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Just-in-time reconciliation between the hub and Supabase auth stores (deliverable B6 + B9).
 *
 * <p>The plaintext-hash problem — neither store can export a hash the other can verify — is solved
 * by using the plaintext from a <b>successful login</b> to reconcile the other store. Two entry
 * points, because the correct LWW direction depends on which store accepted the login:
 * <ul>
 *   <li>{@link #reconcileAfterHubLoginAsync} — hub accepted, so the plaintext is hub-valid. Push it
 *       to Supabase when the hub's password is at least as new; never clobber a genuinely-newer
 *       Supabase password with a possibly-stale hub one.</li>
 *   <li>{@link #reconcileAfterSupabaseLogin} — Supabase accepted (the PWA fell back to Supabase and
 *       later reached the hub), so the plaintext is Supabase-valid. When Supabase's password is
 *       newer, overwrite the hub password with it. This is what converges the "password changed on
 *       Supabase while the hub was down" case.</li>
 * </ul>
 *
 * <p>Conflict resolution is last-writer-wins by {@code passwordUpdatedAt} (UTC). All reconciliation
 * is best-effort and must never break the login it hangs off of.
 *
 * <p>See project/features/users/dual-auth.md.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncAtLoginService {

    /** LWW ties and null timestamps resolve to "hub wins" via this floor. */
    private static final LocalDateTime EPOCH = LocalDateTime.of(1970, 1, 1, 0, 0);

    private final SupabaseAdminClient supabase;
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    private final ExecutorService executor = Executors.newFixedThreadPool(3, r -> {
        Thread t = new Thread(r, "supabase-sync");
        t.setDaemon(true);
        return t;
    });

    @PreDestroy
    void shutdown() {
        executor.shutdown();
    }

    public record ReconcileResult(boolean hubPasswordUpdated, boolean hubUserProvisioned, String message) {}

    // ── Entry points ─────────────────────────────────────────────────────────

    /** Fire-and-forget reconciliation after a hub-accepted login. Never blocks the login response. */
    public void reconcileAfterHubLoginAsync(Long userId, String plaintextPassword) {
        if (!supabase.isEnabled()) return;
        executor.submit(() -> {
            try {
                reconcileAfterHubLogin(userId, plaintextPassword);
            } catch (RuntimeException e) {
                log.debug("[Supabase sync] post-hub-login reconcile failed: {}", e.getMessage());
            }
        });
    }

    /** Fire-and-forget mirror of a hub-side password change to Supabase. */
    public void mirrorPasswordChangeAsync(Long userId, String newPlaintext) {
        if (!supabase.isEnabled()) return;
        executor.submit(() -> {
            try {
                reconcileAfterHubLogin(userId, newPlaintext);
            } catch (RuntimeException e) {
                log.debug("[Supabase sync] password-change mirror failed: {}", e.getMessage());
            }
        });
    }

    // ── Hub-accepted reconciliation ──────────────────────────────────────────

    /**
     * Runs synchronously (used by the async wrappers and by tests). Re-loads the user in a fresh
     * transaction so writes are consistent off the request thread.
     */
    void reconcileAfterHubLogin(Long userId, String plaintextPassword) {
        User user = userRepo.findById(userId).orElse(null);
        if (user == null || user.getEmail() == null) return;
        if (!supabase.isEnabled()) return;

        // Fast path: if the hub already knows the Supabase uuid, reconcile BY UUID. Looking up by
        // email here would miss (and then wrongly re-create) the Supabase user whenever the hub email
        // changed but hasn't propagated yet (e.g. an admin edit of email + password together).
        String knownUuid = user.getSupabaseUuid();
        if (knownUuid != null) {
            SupabaseUser status;
            try {
                status = supabase.getSyncStatusByUuid(knownUuid);
            } catch (SupabaseAdminClient.SupabaseUnavailableException e) {
                return;
            } catch (SupabaseAdminClient.SupabaseClientException e) {
                status = null;
            }
            if (status != null) {
                if (!effective(user.getPasswordUpdatedAt()).isBefore(effective(status.passwordUpdatedAt()))) {
                    supabase.updateUserPassword(knownUuid, plaintextPassword);
                    log.info("[Supabase sync] Pushed hub password to Supabase (by uuid) for {}", user.getEmail());
                }
                // Keep the Supabase auth email aligned with the hub (handles a hub-side email change),
                // and self-heal the cross-reference row (hub_user_id / hub_email) on every login.
                try {
                    supabase.updateUserEmail(knownUuid, user.getEmail());
                } catch (RuntimeException ignore) { /* best-effort */ }
                try {
                    supabase.linkHubUser(knownUuid, user.getId(), user.getEmail());
                } catch (RuntimeException ignore) { /* best-effort */ }
                return;
            }
            // uuid stored but no link row (stale/orphan) — fall through to email-based recovery.
        }

        SupabaseUser sb;
        try {
            sb = supabase.getUserByEmail(user.getEmail());
        } catch (SupabaseAdminClient.SupabaseUnavailableException e) {
            log.debug("[Supabase sync] Supabase down — skipping hub-login reconcile for {}", user.getEmail());
            return;
        } catch (SupabaseAdminClient.SupabaseClientException e) {
            log.debug("[Supabase sync] Supabase 4xx during lookup for {}: {}", user.getEmail(), e.getMessage());
            return;
        }

        if (sb == null) {
            // Supabase has never seen this user — create it with the just-verified plaintext.
            String uuid = supabase.createUser(user.getEmail(), plaintextPassword, SupabaseAdminClient.metadataFor(user));
            if (uuid != null) {
                // Persist the uuid FIRST — it's the critical link the whole design relies on; the
                // cross-reference PATCH (hub_user_id/hub_email) is cosmetic and must not be able to
                // prevent the uuid from being stored.
                storeSupabaseUuid(user, uuid);
                try {
                    supabase.linkHubUser(uuid, user.getId(), user.getEmail());
                } catch (RuntimeException ignore) { /* best-effort — self-heals on next login */ }
                log.info("[Supabase sync] Created Supabase user for {} on hub login", user.getEmail());
            }
            return;
        }

        if (user.getSupabaseUuid() == null && sb.uuid() != null) {
            storeSupabaseUuid(user, sb.uuid());
            try {
                supabase.linkHubUser(sb.uuid(), user.getId(), user.getEmail());
            } catch (RuntimeException ignore) { /* best-effort */ }
        }

        LocalDateTime hubTs = effective(user.getPasswordUpdatedAt());
        LocalDateTime sbTs = effective(sb.passwordUpdatedAt());

        if (!hubTs.isBefore(sbTs)) {
            // Hub password is at least as new — make Supabase match.
            supabase.updateUserPassword(sb.uuid(), plaintextPassword);
            log.info("[Supabase sync] Pushed hub password to Supabase for {}", user.getEmail());
        } else {
            // Supabase claims a strictly-newer password. The hub plaintext may be stale, so leave the
            // passwords divergent; a Supabase-accepted login will converge the hub side.
            log.info("[Supabase sync] Supabase password newer for {} — awaiting Supabase-authenticated login to converge hub",
                    user.getEmail());
        }
    }

    // ── Supabase-accepted reconciliation (called by the /reconcile endpoint) ──

    /**
     * Called when the PWA logged in via the Supabase fallback and then reached the hub. The plaintext
     * is Supabase-valid. Provisions the hub user if missing, and overwrites the hub password when
     * Supabase's is newer (LWW).
     */
    public ReconcileResult reconcileAfterSupabaseLogin(String email, String plaintextPassword) {
        if (!supabase.isEnabled()) {
            return new ReconcileResult(false, false, "Supabase not configured");
        }
        SupabaseUser sb;
        try {
            sb = supabase.getUserByEmail(email);
        } catch (RuntimeException e) {
            return new ReconcileResult(false, false, "Supabase lookup failed: " + e.getMessage());
        }

        User user = userRepo.findFirstByEmailOrderByIdAsc(email);
        boolean provisioned = false;
        if (user == null) {
            user = provisionHubUserFromSupabase(email, plaintextPassword, sb);
            provisioned = true;
            return new ReconcileResult(true, true, "Provisioned hub user (pending admin approval)");
        }

        if (user.getSupabaseUuid() == null && sb != null && sb.uuid() != null) {
            storeSupabaseUuid(user, sb.uuid());
        }

        LocalDateTime hubTs = effective(user.getPasswordUpdatedAt());
        LocalDateTime sbTs = effective(sb == null ? null : sb.passwordUpdatedAt());

        if (!sbTs.isBefore(hubTs)) {
            // Supabase password is at least as new — overwrite hub with the just-verified plaintext.
            user.setPassword(passwordEncoder.encode(plaintextPassword));
            user.setPasswordUpdatedAt(sbTs.isAfter(EPOCH) ? sbTs : LocalDateTime.now(ZoneOffset.UTC));
            userRepo.save(user);
            log.info("[Supabase sync] Overwrote hub password from Supabase for {}", email);
            return new ReconcileResult(true, false, "Hub password updated from Supabase");
        }
        log.info("[Supabase sync] Hub password newer for {} — no hub change", email);
        return new ReconcileResult(false, false, "Hub password already newer");
    }

    // ── Auto-provisioning (B9) ────────────────────────────────────────────────

    /**
     * Creates a hub User row for a user that so far only exists in Supabase. isActive=false and
     * role="" — pending admin approval, matching existing PWA registration semantics. When a plaintext
     * is available (Supabase-authenticated reconcile) the hub stores its BCrypt hash; otherwise a
     * random unusable placeholder is stored (the user can't log into the hub until approved anyway).
     */
    public User provisionHubUserFromSupabase(String email, String plaintextOrNull, SupabaseUser sbOrNull) {
        // Idempotency: if a hub row already exists (created by a concurrent request or a prior call),
        // reuse it rather than creating a duplicate (email is unique).
        User existing = userRepo.findFirstByEmailOrderByIdAsc(email);
        if (existing != null) return existing;

        SupabaseUser sb = sbOrNull;
        if (sb == null && supabase.isEnabled()) {
            try {
                sb = supabase.getUserByEmail(email);
            } catch (RuntimeException ignored) { /* provision from email alone */ }
        }

        Map<String, Object> md = sb == null ? Map.of() : sb.metadata();
        String name = str(md.get("name"));
        if (name == null) name = email;
        String[] split = splitName(name);

        String rawPassword = plaintextOrNull != null ? plaintextOrNull : ("!prov-" + UUID.randomUUID());
        LocalDateTime pwdTs = plaintextOrNull != null && sb != null && sb.passwordUpdatedAt() != null
                ? sb.passwordUpdatedAt()
                : LocalDateTime.now(ZoneOffset.UTC);

        User user = User.builder()
                .username(email)
                .email(email)
                .name(name)
                .firstName(split[0])
                .lastName(split[1])
                .phone(str(md.get("phone")))
                .company(str(md.get("company")))
                .password(passwordEncoder.encode(rawPassword))
                .role("")                // pending admin approval
                .isActive(false)
                .permissionLevel("NONE")
                .supabaseUuid(sb == null ? null : sb.uuid())
                .passwordUpdatedAt(pwdTs)
                .build();
        try {
            userRepo.save(user);
        } catch (org.springframework.dao.DataIntegrityViolationException race) {
            // TOCTOU: a concurrent request inserted the same email between our guard and this save.
            // Reuse the winner rather than surfacing a unique-constraint 500.
            User winner = userRepo.findFirstByEmailOrderByIdAsc(email);
            if (winner != null) {
                log.info("[Supabase sync] Provision race for {} — reusing concurrently-created row", email);
                return winner;
            }
            throw race;
        }

        if (sb != null && sb.uuid() != null) {
            try {
                supabase.linkHubUser(sb.uuid(), user.getId(), email);
            } catch (RuntimeException e) {
                log.debug("[Supabase sync] linkHubUser failed during provisioning of {}: {}", email, e.getMessage());
            }
        }
        log.info("[Supabase sync] Auto-provisioned hub user {} from Supabase (inactive, pending approval)", email);
        return user;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void storeSupabaseUuid(User user, String uuid) {
        User fresh = userRepo.findById(user.getId()).orElse(null);
        if (fresh != null && fresh.getSupabaseUuid() == null) {
            fresh.setSupabaseUuid(uuid);
            userRepo.save(fresh);
        }
        user.setSupabaseUuid(uuid);
    }

    private static LocalDateTime effective(LocalDateTime ts) {
        return ts == null ? EPOCH : ts;
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }

    private static String[] splitName(String name) {
        int idx = name.indexOf(' ');
        if (idx > 0) return new String[]{name.substring(0, idx), name.substring(idx + 1)};
        return new String[]{name, ""};
    }
}
