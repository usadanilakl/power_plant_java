package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/**
 * One-shot migration: mirrors existing active hub Users into Supabase (deliverable G).
 *
 * <p><b>Usually unnecessary now:</b> {@code SupabaseReconciliationService} auto-provisions missing
 * active users every 60s by default ({@code supabase.auto-provision-missing=true}), so existing users
 * are picked up automatically over a few cycles. This one-shot job remains as an optional <i>fast</i>
 * path — it provisions everyone immediately in one pass (no per-cycle batch cap), handy for a large
 * initial migration you don't want to wait for.
 *
 * <p>Runs once at startup, only under the {@code dev} profile AND only when
 * {@code supabase.provision-existing-on-startup=true} — so it never fires by accident. For each
 * active user without a {@code supabaseUuid} it creates a Supabase user with a random throwaway
 * password (real passwords can't be exported), stores the returned uuid back on the hub row, and
 * backdates the Supabase password timestamp to the epoch so the user's <b>first hub login</b>
 * reconciles their real password into Supabase via the sync-at-login pattern.
 *
 * <p>Idempotent: users already carrying a {@code supabaseUuid} are skipped, so it is safe to re-run.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class SupabaseUserProvisioningJob {

    /** A clearly-old sentinel so the temp password always loses the LWW comparison. */
    private static final LocalDateTime EPOCH = LocalDateTime.of(1970, 1, 1, 0, 0);

    private final UserRepo userRepo;
    private final SupabaseAdminClient supabase;
    private final org.springframework.core.env.Environment env;

    @EventListener(ApplicationReadyEvent.class)
    public void provisionExistingUsers() {
        if (!Boolean.parseBoolean(env.getProperty("supabase.provision-existing-on-startup", "false"))) {
            return;
        }
        if (!supabase.isEnabled() || !supabase.ping()) {
            log.warn("[Supabase provision] Skipped — Supabase not configured/reachable.");
            return;
        }

        List<User> pending = userRepo.findSupabaseMirrorCandidates(org.springframework.data.domain.Pageable.unpaged());
        log.info("[Supabase provision] Starting bulk provisioning of {} active user(s) with real emails…", pending.size());

        int provisioned = 0, failed = 0;
        for (User user : pending) {
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                log.warn("[Supabase provision] Skipping user id={} — no email", user.getId());
                continue;
            }
            try {
                String tempPassword = "Tmp-" + UUID.randomUUID();
                String uuid = supabase.createUser(user.getEmail(), tempPassword, SupabaseAdminClient.metadataFor(user));
                if (uuid == null) {
                    failed++;
                    log.warn("[Supabase provision] No uuid returned for {}", user.getEmail());
                    continue;
                }
                user.setSupabaseUuid(uuid);
                user.setPasswordUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                userRepo.save(user);

                supabase.linkHubUser(uuid, user.getId(), user.getEmail());
                supabase.setLinkPasswordUpdatedAt(uuid, EPOCH); // real password wins on first login
                provisioned++;
            } catch (RuntimeException e) {
                failed++;
                log.warn("[Supabase provision] Failed for {}: {}", user.getEmail(), e.getMessage());
            }
        }
        log.info("[Supabase provision] Done. provisioned={}, failed={}, alreadyLinked(skipped)={}",
                provisioned, failed, "(users with supabaseUuid were not selected)");
    }
}
