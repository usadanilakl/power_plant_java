package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.auth.SupabaseSyncCheckpoint;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.auth.SupabaseSyncCheckpointRepository;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient.SupabaseLink;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient.SupabaseUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/**
 * Background metadata reconciliation between the hub and Supabase (deliverable B7). Runs on every
 * deployment (not hub-only). Every 60 s, when Supabase is reachable:
 *
 * <ul>
 *   <li><b>Hub → Supabase</b>: pushes metadata (name, email, roles, isActive, permissionLevel) for
 *       hub Users touched since the last checkpoint. Hub is the source of truth for these.</li>
 *   <li><b>Supabase → Hub</b>: pulls <em>only</em> the name back to the hub for user_link rows whose
 *       metadata changed since the last checkpoint — never email (hub-authoritative; see
 *       {@code applyPull}), role, isActive, or permissionLevel.</li>
 * </ul>
 *
 * <p>Checkpoints are persisted per direction and per node (see {@link SupabaseSyncCheckpoint}).
 * Every write is guarded to be a no-op when values already match, which breaks the push/pull
 * ping-pong after a single bounce. See project/features/users/dual-auth.md.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseReconciliationService {

    static final String CP_HUB_TO_SB = "hub_to_supabase";
    static final String CP_SB_TO_HUB = "supabase_to_hub";

    /** LWW floor so an auto-provisioned throwaway password always loses to the real one at first login. */
    private static final LocalDateTime EPOCH = LocalDateTime.of(1970, 1, 1, 0, 0);

    private final SupabaseAdminClient supabase;
    private final UserRepo userRepo;
    private final SupabaseSyncCheckpointRepository checkpointRepo;
    private final SyncConfig syncConfig;
    private final Environment env;

    /** Self-heal: create Supabase rows for active hub users that don't have one yet. Default on. */
    @Value("${supabase.auto-provision-missing:true}")
    private boolean autoProvisionMissing;
    /** Max users auto-provisioned per 60s cycle, so a first run drains gradually instead of bursting. */
    @Value("${supabase.auto-provision-batch:50}")
    private int autoProvisionBatch;

    @Scheduled(fixedDelay = 60_000, initialDelay = 45_000)
    public void reconcile() {
        // Heavy background Supabase sync runs on the hub (and in dev) — NOT on every prod desktop, which
        // would race and hammer Supabase. Desktops sync users to the hub via CRDT; the hub mirrors out.
        if (isProdDesktop()) return;
        if (!supabase.isEnabled() || !supabase.ping()) return;
        try {
            provisionMissingUsers();
        } catch (RuntimeException e) {
            log.warn("[Supabase reconcile] auto-provision failed: {}", e.getMessage());
        }
        try {
            pushHubMetadataToSupabase();
        } catch (RuntimeException e) {
            log.warn("[Supabase reconcile] hub→supabase failed: {}", e.getMessage());
        }
        try {
            pullSupabaseMetadataToHub();
        } catch (RuntimeException e) {
            log.warn("[Supabase reconcile] supabase→hub failed: {}", e.getMessage());
        }
    }

    /** True on a production DESKTOP node (prod profile, not the hub). Dev/test and the hub return false. */
    private boolean isProdDesktop() {
        for (String p : env.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(p)) return !syncConfig.isHubMode();
        }
        return false;
    }

    // ── Self-heal: auto-provision missing users (deliverable — unified with outage recovery) ──

    /**
     * Creates Supabase rows for active hub users that don't have a {@code supabaseUuid} yet — existing
     * users at first rollout AND anyone created while Supabase was down. This makes the mirror
     * self-healing: an un-mirrored user no longer waits for a manual one-shot job or their next login.
     * Same technique as bulk-provisioning: a throwaway password + a backdated (epoch) Supabase
     * timestamp, so the user's next hub login pushes their real password (LWW). Batched per cycle.
     */
    void provisionMissingUsers() {
        if (!autoProvisionMissing) return;
        List<User> missing = userRepo.findSupabaseMirrorCandidates(
                PageRequest.of(0, Math.max(1, autoProvisionBatch)));
        int created = 0;
        for (User u : missing) {
            if (u.getEmail() == null || u.getEmail().isBlank()) continue;
            try {
                String tempPassword = "!heal-" + UUID.randomUUID();
                String uuid = supabase.createUser(u.getEmail(), tempPassword, SupabaseAdminClient.metadataFor(u));
                if (uuid == null) continue;
                u.setSupabaseUuid(uuid);
                if (u.getPasswordUpdatedAt() == null) {
                    u.setPasswordUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                }
                userRepo.save(u);
                supabase.linkHubUser(uuid, u.getId(), u.getEmail());
                supabase.setLinkPasswordUpdatedAt(uuid, EPOCH); // real password wins on first login
                created++;
            } catch (SupabaseAdminClient.SupabaseUnavailableException unavailable) {
                break; // transient — retry remaining users next cycle
            } catch (RuntimeException e) {
                log.debug("[Supabase reconcile] auto-provision failed for {}: {}", u.getEmail(), e.getMessage());
            }
        }
        if (created > 0) {
            log.info("[Supabase reconcile] auto-provisioned {} missing user(s) into Supabase", created);
        }
    }

    // ── Hub → Supabase ────────────────────────────────────────────────────────

    void pushHubMetadataToSupabase() {
        LocalDateTime cp = getCheckpoint(CP_HUB_TO_SB);
        if (cp == null) {
            // Bootstrap: don't re-push all history on first ever run (bulk-provisioning handles the
            // initial mirror). Start tracking from now.
            setCheckpoint(CP_HUB_TO_SB, LocalDateTime.now());
            return;
        }
        List<User> changed = userRepo.findByDateModifiedAfterOrderByDateModifiedAsc(cp);
        // The checkpoint advances only on a CLEAN pass (all records handled). A transient outage
        // mid-batch commits NOTHING and returns, so the whole batch (all idempotent) retries next
        // cycle — this avoids both lost edits and the identical-timestamp tie-group split that a
        // partial per-record watermark would cause. A permanently-bad record (4xx) is skipped so it
        // can't block the batch, and the clean pass still commits past it.
        LocalDateTime maxTs = cp;
        int pushed = 0;
        for (User u : changed) {
            LocalDateTime ts = u.getDateModified();
            if (u.getSupabaseUuid() == null || u.getEmail() == null) {
                maxTs = advance(maxTs, ts); // not mirrored yet — nothing to push
                continue;
            }
            try {
                supabase.updateUserMetadata(u.getSupabaseUuid(), SupabaseAdminClient.metadataFor(u));
                // Keep the Supabase auth-level email in step with the hub (idempotent when unchanged).
                try {
                    supabase.updateUserEmail(u.getSupabaseUuid(), u.getEmail());
                } catch (RuntimeException ignore) { /* best-effort */ }
                pushed++;
                maxTs = advance(maxTs, ts);
            } catch (SupabaseAdminClient.SupabaseUnavailableException unavailable) {
                log.debug("[Supabase reconcile] transient push failure — retrying whole batch next cycle");
                return; // commit nothing; leave checkpoint at cp
            } catch (RuntimeException permanent) {
                log.debug("[Supabase reconcile] metadata push failed for {}: {}", u.getEmail(), permanent.getMessage());
                maxTs = advance(maxTs, ts); // skip past a permanently-bad record
            }
        }
        setCheckpoint(CP_HUB_TO_SB, maxTs);
        if (pushed > 0) log.info("[Supabase reconcile] pushed metadata for {} user(s) to Supabase", pushed);
    }

    // ── Supabase → Hub ────────────────────────────────────────────────────────

    void pullSupabaseMetadataToHub() {
        LocalDateTime cp = getCheckpoint(CP_SB_TO_HUB);
        if (cp == null) {
            setCheckpoint(CP_SB_TO_HUB, LocalDateTime.now(ZoneOffset.UTC));
            return;
        }
        List<SupabaseLink> links = supabase.listLinksModifiedSince(cp);
        LocalDateTime maxTs = cp;
        int pulled = 0;
        for (SupabaseLink link : links) {
            LocalDateTime ts = link.metadataUpdatedAt();
            if (link.uuid() == null) {
                maxTs = advance(maxTs, ts);
                continue;
            }
            try {
                User user = userRepo.findFirstBySupabaseUuidOrderByIdAsc(link.uuid());
                if (user == null && link.hubEmail() != null) {
                    user = userRepo.findFirstByEmailOrderByIdAsc(link.hubEmail());
                }
                if (user == null) {
                    // Supabase-only user not yet provisioned on the hub — login/filter provisions it.
                    maxTs = advance(maxTs, ts);
                    continue;
                }

                SupabaseUser sb = supabase.getUserByUuid(link.uuid());
                if (sb != null && applyPull(user, sb)) {
                    userRepo.save(user);
                    pulled++;
                }
                maxTs = advance(maxTs, ts);
            } catch (SupabaseAdminClient.SupabaseUnavailableException unavailable) {
                log.debug("[Supabase reconcile] transient pull failure — retrying whole batch next cycle");
                return; // commit nothing; leave checkpoint at cp
            } catch (RuntimeException permanent) {
                log.debug("[Supabase reconcile] pull failed for {}: {}", link.uuid(), permanent.getMessage());
                maxTs = advance(maxTs, ts); // skip past a permanently-bad record
            }
        }
        setCheckpoint(CP_SB_TO_HUB, maxTs);
        if (pulled > 0) log.info("[Supabase reconcile] pulled name for {} user(s) from Supabase", pulled);
    }

    /**
     * Applies the hub-syncable Supabase field(s) onto the hub user. Returns true if anything changed.
     *
     * <p>Only {@code name} is pulled — NOT email. Email lives in two Supabase places (auth.users.email
     * and the mirrored raw_user_meta_data.email); a partial hub→Supabase push (metadata ok but the
     * separate updateUserEmail failed) would leave them divergent, and pulling the stale auth email
     * back would silently revert a newer hub email change. The hub is the authority for email — it
     * flows hub→Supabase only. (A rare Supabase-side email change during a hub outage is redone on the
     * hub by an admin.)
     */
    private boolean applyPull(User user, SupabaseUser sb) {
        Object sbNameObj = sb.metadata() == null ? null : sb.metadata().get("name");
        String sbName = sbNameObj == null ? null : sbNameObj.toString();
        if (sbName != null && !sbName.isBlank() && !sbName.equals(nullSafe(user.getName()))) {
            user.setName(sbName);
            int idx = sbName.indexOf(' ');
            user.setFirstName(idx > 0 ? sbName.substring(0, idx) : sbName);
            user.setLastName(idx > 0 ? sbName.substring(idx + 1) : "");
            return true;
        }
        return false;
    }

    /** Monotonically moves the watermark forward to {@code ts} when it is later (null-safe). */
    private static LocalDateTime advance(LocalDateTime watermark, LocalDateTime ts) {
        return (ts != null && ts.isAfter(watermark)) ? ts : watermark;
    }

    // ── Checkpoint helpers ────────────────────────────────────────────────────

    LocalDateTime getCheckpoint(String name) {
        return checkpointRepo.findById(name).map(SupabaseSyncCheckpoint::getCheckpointAt).orElse(null);
    }

    void setCheckpoint(String name, LocalDateTime ts) {
        checkpointRepo.save(new SupabaseSyncCheckpoint(name, ts));
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }
}
