package com.dk_power.power_plant_java.controller.angular.admin;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient;
import com.dk_power.power_plant_java.sevice.auth.SupabaseReconciliationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-only tooling for unsticking users the scheduled {@link SupabaseReconciliationService}
 * skipped or repeatedly failed to provision. Motivating symptom: chat returns 503
 * "User X has no supabaseUuid" on some clients because the reconciler filter (must be active +
 * have a dotted-domain email) permanently excludes shared accounts, operators without email, or
 * users with malformed addresses. Prior to these endpoints, the only failure signal was a DEBUG
 * log line so operators had no visibility into which users were stuck or why.
 */
@Slf4j
@RestController
@RequestMapping("/ng/admin/supabase")
@RequiredArgsConstructor
public class NgSupabaseAdminController {

    private final UserRepo userRepo;
    private final SupabaseReconciliationService reconciliationService;
    private final SupabaseAdminClient supabaseAdminClient;

    /**
     * Every active-or-inactive User with a null {@code supabaseUuid}, plus a classifier explaining
     * which reconciler filter would exclude them (so the admin knows what override to send). The
     * {@code eligible} flag is what the scheduled reconciler would consider — {@code false} means
     * the user won't self-heal without manual intervention.
     */
    @GetMapping("/orphans")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> orphans() {
        List<User> all = userRepo.findAll();
        List<Map<String, Object>> orphans = new ArrayList<>();
        for (User u : all) {
            if (u.getSupabaseUuid() != null) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", u.getId());
            row.put("username", u.getUsername());
            row.put("email", u.getEmail());
            row.put("isActive", u.getIsActive());
            row.put("reason", classify(u));
            row.put("eligibleForAutoProvision", classify(u).equals("eligible"));
            orphans.add(row);
        }
        return ResponseEntity.ok(new NgApiResponse<>(orphans, "Orphans"));
    }

    /**
     * Force-provision one user. Body fields, all optional:
     * <ul>
     *   <li>{@code emailOverride} — use instead of stored email (bypasses null / bad-domain checks).</li>
     *   <li>{@code linkExistingUuid} — skip Supabase createUser and just record this pre-existing
     *       uuid on the hub row. Use when the user already exists in Supabase from another node.</li>
     * </ul>
     */
    @PostMapping("/orphan/{userId}/provision")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> provisionOne(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> body) {
        String emailOverride = body == null ? null : body.get("emailOverride");
        String linkExistingUuid = body == null ? null : body.get("linkExistingUuid");
        try {
            String uuid = reconciliationService.provisionOneUser(userId, emailOverride, linkExistingUuid);
            Map<String, Object> payload = Map.of("userId", userId, "supabaseUuid", uuid);
            return ResponseEntity.ok(new NgApiResponse<>(payload, "Provisioned"));
        } catch (Exception e) {
            log.warn("[SupabaseAdmin] provision-one failed for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,
                    "Provision failed: " + e.getMessage()));
        }
    }

    /**
     * Look up a Supabase user by email — helper for the admin UI to preview the uuid before
     * calling {@code /orphan/{id}/provision} with {@code linkExistingUuid}. Returns {@code null}
     * if no such user exists in Supabase.
     */
    @GetMapping("/lookup")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> lookupByEmail(@RequestParam String email) {
        try {
            SupabaseAdminClient.SupabaseUser found = supabaseAdminClient.getUserByEmail(email);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("email", email);
            payload.put("uuid", found == null ? null : found.uuid());
            return ResponseEntity.ok(new NgApiResponse<>(payload, found == null ? "Not found" : "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,
                    "Lookup failed: " + e.getMessage()));
        }
    }

    /**
     * Kick the scheduled reconciler immediately instead of waiting up to 60 s. Same guards as the
     * regular tick — silently no-ops on a prod desktop or when Supabase is unreachable.
     */
    @PostMapping("/reconcile-now")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> reconcileNow() {
        try {
            reconciliationService.reconcileNow();
            return ResponseEntity.ok(new NgApiResponse<>(Map.of("triggered", true), "Reconcile triggered"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null,
                    "Reconcile failed: " + e.getMessage()));
        }
    }

    private String classify(User u) {
        if (Boolean.FALSE.equals(u.getIsActive())) return "inactive";
        String email = u.getEmail();
        if (email == null || email.isBlank()) return "no-email";
        // findSupabaseMirrorCandidates uses `email like '%@%.%'` — matches @ + dot after @.
        int at = email.indexOf('@');
        if (at < 1 || at == email.length() - 1) return "malformed-email";
        String domain = email.substring(at + 1);
        if (!domain.contains(".")) return "non-dotted-domain";
        return "eligible";
    }
}
