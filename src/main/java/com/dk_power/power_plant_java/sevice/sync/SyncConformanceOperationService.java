package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.users.LotoRole;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Sync-conformance harness — Generator 2: real-operation tests.
 *
 * <p>Where the scalar field sweep ({@link SyncConformanceService#fieldSweep}) can't reach: collection /
 * membership / lifecycle operations, which are invoked as real service operations (through the same role
 * gates the frontend hits) and then checked for emission. A raw collection field-set never emits — that is
 * the whole bug class — so these MUST go through the operation, not a reflective set.
 *
 * <p>Flagship: {@code LotoStandard.lotoPoints} add/remove. Seeds a throwaway DRAFT standard + points, runs
 * the CONTROL_AUTHORITY-gated add/remove as an existing CA user, and asserts a {@code lotoPoints} /
 * ManyToMany FieldChange was emitted — which is exactly what the reported regression failed to do.
 *
 * <p>Gated by {@code sync.test-endpoints.enabled}; every entry point re-checks the isolation guard.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "sync.test-endpoints.enabled", havingValue = "true")
public class SyncConformanceOperationService {

    private final SyncConformanceService conformance;
    private final NgLotoStandardService lotoStandardService;
    private final LotoStandardRepo lotoStandardRepo;
    private final LotoPointRepo lotoPointRepo;
    private final UserRepo userRepo;
    private final FieldChangeRepository fieldChangeRepository;

    /**
     * LotoStandard membership operations (the flagship). Runs REMOVE then ADD of a member through the real
     * gated service and asserts each emitted a lotoPoints/ManyToMany FieldChange on the standard.
     */
    public List<ConformanceResult> lotoStandardMembership() {
        conformance.assertIsolatedOrThrow();
        List<ConformanceResult> results = new ArrayList<>();

        String prefix = "SYNC_CONFORMANCE_" + System.nanoTime();
        CaUser caw = findOrSeedCaUser(prefix);
        if (caw == null || caw.user() == null) {
            results.add(new ConformanceResult("LotoStandard", null, "lotoPoints", "ManyToMany", "membership",
                    false, null, true, "skipped: no CONTROL_AUTHORITY user available and could not seed a throwaway one"));
            return results;
        }
        User ca = caw.user();
        Long standardId = null, p1 = null, p2 = null;
        try {
            LotoPoint lp1 = newPoint(prefix + "_P1");
            LotoPoint lp2 = newPoint(prefix + "_P2");
            p1 = lp1.getId();
            p2 = lp2.getId();

            LotoStandard ls = new LotoStandard();
            ls.setName(prefix + "_Standard");
            ls.setDescription("conformance throwaway");
            ls.addLotoPoint(lp1);
            ls.addLotoPoint(lp2);
            Map<String, Integer> order = new LinkedHashMap<>();
            order.put(String.valueOf(p1), 1);
            order.put(String.valueOf(p2), 2);
            ls.setLotoPointOrder(order);
            ls = lotoStandardRepo.saveAndFlush(ls);
            standardId = ls.getId();

            final Long sid = standardId;
            final Long point2 = p2;
            Authentication prev = SecurityContextHolder.getContext().getAuthentication();
            try {
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(ca.getUsername(), null, List.of()));

                // ---- REMOVE (the exact reported bug) ----
                results.add(runMembership("remove", sid, () ->
                        lotoStandardService.removeLotoPointToStandard(point2, String.valueOf(sid))));

                // ---- ADD (re-attach) ----
                results.add(runMembership("add", sid, () ->
                        lotoStandardService.addLotoPointToStandard(point2, String.valueOf(sid))));

                // ---- NEGATIVE CONTROL: raw collection removal, NO scalar touch (bypasses the service fix) ----
                // This is the pure-M2M mechanism that produced the original bug: mutating only the join table
                // never fires @PostUpdate, so it must emit NOTHING. If the harness reports emitted=true here it
                // is broken; emitted=false proves it discriminates emit from no-emit (and why the service must
                // dirty a scalar). Expected: emitted=false.
                results.add(runRawRemoval(sid, point2));
            } finally {
                SecurityContextHolder.getContext().setAuthentication(prev);
            }
        } catch (Exception e) {
            results.add(new ConformanceResult("LotoStandard", standardId, "lotoPoints", "ManyToMany", "membership",
                    false, null, true, "setup/error: " + rootMsg(e)));
        } finally {
            teardown(standardId, p1, p2, caw.seededId());
        }
        return results;
    }

    private ConformanceResult runMembership(String kind, Long standardId, Runnable op) {
        Set<UUID> before = changeIds(standardId);
        try {
            op.run();
        } catch (Exception e) {
            return new ConformanceResult("LotoStandard", standardId, "lotoPoints", "ManyToMany", kind,
                    false, null, false, "operation threw: " + rootMsg(e));
        }
        List<FieldChange> nu;
        try { nu = newChanges(standardId, before); }
        catch (Exception e) {
            return new ConformanceResult("LotoStandard", standardId, "lotoPoints", "ManyToMany", kind, false, null, false,
                    "emission query failed: " + rootMsg(e));
        }
        boolean membershipEmitted = nu.stream().anyMatch(fc ->
                "lotoPoints".equals(fc.getFieldName()) || "ManyToMany".equals(fc.getRelationshipType()));
        String fields = nu.stream().map(FieldChange::getFieldName).distinct().limit(12).toList().toString();
        return new ConformanceResult("LotoStandard", standardId, "lotoPoints", "ManyToMany", kind,
                membershipEmitted, null, false,
                membershipEmitted ? "emitted OK (new fields: " + fields + ")"
                        : "NO lotoPoints/ManyToMany FieldChange emitted — EMISSION GAP (new fields: " + fields + ")");
    }

    /** All FieldChange ids currently on the standard — the "before" snapshot for a precise per-op id-diff. */
    private Set<UUID> changeIds(Long standardId) {
        return fieldChangeRepository.findByEntityTypeAndEntityIdAndTimestampAfter("LotoStandard", standardId, Instant.EPOCH)
                .stream().map(FieldChange::getId).collect(java.util.stream.Collectors.toSet());
    }

    /** FieldChanges on the standard whose id is NOT in {@code before} — i.e. produced by the op just run. */
    private List<FieldChange> newChanges(Long standardId, Set<UUID> before) {
        return fieldChangeRepository.findByEntityTypeAndEntityIdAndTimestampAfter("LotoStandard", standardId, Instant.EPOCH)
                .stream().filter(fc -> !before.contains(fc.getId())).toList();
    }

    /** Negative control: remove a member by mutating ONLY the collection + save — no scalar dirtied → must not emit. */
    private ConformanceResult runRawRemoval(Long standardId, Long pointId) {
        Set<UUID> before = changeIds(standardId);
        try {
            LotoStandard ls = lotoStandardRepo.findById(standardId).orElse(null);
            if (ls == null) return new ConformanceResult("LotoStandard", standardId, "lotoPoints", "ManyToMany",
                    "raw-remove", false, null, true, "skipped: standard vanished");
            ls.getLotoPoints().removeIf(p -> pointId.equals(p.getId()));
            lotoStandardRepo.saveAndFlush(ls); // pure @ManyToMany change, no scalar co-edit
        } catch (Exception e) {
            return new ConformanceResult("LotoStandard", standardId, "lotoPoints", "ManyToMany", "raw-remove",
                    false, null, false, "raw removal threw: " + rootMsg(e));
        }
        List<FieldChange> nu;
        try { nu = newChanges(standardId, before); }
        catch (Exception e) { return new ConformanceResult("LotoStandard", standardId, "lotoPoints", "ManyToMany", "raw-remove", false, null, false, "emission query failed: " + rootMsg(e)); }
        boolean membershipEmitted = nu.stream().anyMatch(fc ->
                "lotoPoints".equals(fc.getFieldName()) || "ManyToMany".equals(fc.getRelationshipType()));
        String fields = nu.stream().map(FieldChange::getFieldName).distinct().limit(12).toList().toString();
        return new ConformanceResult("LotoStandard", standardId, "lotoPoints", "ManyToMany", "raw-remove",
                membershipEmitted, null, false,
                membershipEmitted ? "raw collection change DID emit (new fields: " + fields + ")"
                        : "expected: NO emit from a pure-M2M change (new fields: " + fields + ")");
    }

    private LotoPoint newPoint(String name) {
        LotoPoint lp = new LotoPoint();
        lp.setName(name);
        lp.setTagNumber(name);
        lp.setDescription("conformance throwaway point");
        return lotoPointRepo.saveAndFlush(lp);
    }

    /** An existing or freshly-seeded CONTROL_AUTHORITY user to run the gated op as; {@code seededId} != null if we made it. */
    private record CaUser(User user, Long seededId) {}

    private CaUser findOrSeedCaUser(String prefix) {
        try {
            for (User u : userRepo.findAll()) {
                if (u.getUsername() == null) continue;
                if (u.hasLotoRole(LotoRole.CONTROL_AUTHORITY) || u.hasLotoRole(LotoRole.QUALIFIED)) return new CaUser(u, null);
            }
        } catch (Exception ignore) { /* fall through to seeding */ }
        try {
            User u = new User();
            u.setUsername(prefix + "_CA");
            u.setEmail(prefix + "_ca@conformance.invalid");
            u.setPassword("x");
            u.addRole(LotoRole.CONTROL_AUTHORITY.roleName());
            u = userRepo.saveAndFlush(u);
            return new CaUser(u, u.getId());
        } catch (Exception e) {
            log.warn("conformance: could not seed a throwaway CA user: {}", e.getMessage());
            return null;
        }
    }

    private void teardown(Long standardId, Long p1, Long p2, Long seededUserId) {
        try {
            if (standardId != null) lotoStandardRepo.findById(standardId).ifPresent(ls -> { ls.setDeleted(true); lotoStandardRepo.save(ls); });
            if (p1 != null) lotoPointRepo.findById(p1).ifPresent(lp -> { lp.setDeleted(true); lotoPointRepo.save(lp); });
            if (p2 != null) lotoPointRepo.findById(p2).ifPresent(lp -> { lp.setDeleted(true); lotoPointRepo.save(lp); });
            if (seededUserId != null) userRepo.findById(seededUserId).ifPresent(u -> { u.setDeleted(true); userRepo.save(u); });
        } catch (Exception e) {
            log.warn("conformance teardown failed (throwaways left soft-live): {}", e.getMessage());
        }
    }

    private String rootMsg(Throwable t) {
        while (t.getCause() != null && t.getCause() != t) t = t.getCause();
        return t.getClass().getSimpleName() + ": " + t.getMessage();
    }
}
