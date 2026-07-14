package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_permit.PwaLotoDtos.*;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PositionOptionsDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoPermitGrab;
import com.dk_power.power_plant_java.entities.loto.LotoSnapshot;
import com.dk_power.power_plant_java.entities.loto.PointPrerequisite;
import com.dk_power.power_plant_java.entities.loto.WalkdownSession;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.loto.LotoPermitGrabRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgWalkdownSessionService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Mobile (PWA) LOTO permit hang / verify / walkdown. A thin orchestration layer over the existing synced beans
 * ({@link NgLotoService} for the per-point/aggregate hang+verify lifecycle, {@link NgWalkdownSessionService} for the
 * repeatable walkdown), so all role gates + separation-of-duty + predecessor rules stay server-authoritative.
 *
 * <p>Offline shape mirrors the LOTO-Standards walkdown: the client grabs a phase online, caches the permit + points +
 * drawings, does the whole checklist offline against a draft, and submits ONCE — the batch submits replay each
 * per-point action so the server re-enforces every rule; already-done points are skipped and per-point failures are
 * reported, never fatal. The batch methods are intentionally NOT {@code @Transactional} so each delegated call commits
 * independently (partial progress survives, re-submit applies the rest).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PwaLotoService {

    private final LotoRepo lotoRepo;
    private final NgLotoService ngLotoService;
    private final NgWalkdownSessionService walkdownService;
    private final LotoPermitGrabRepo grabRepo;
    private final PwaLotoStandardWalkdownService standardsWalkdown; // reuse position-options helper
    private final PwaLotoDrawingService drawingService;
    private final PwaLotoReadService readService; // transactional reads (separate bean — see its Javadoc)
    private final UserRepo userRepo;

    // ── list ──

    @Transactional(readOnly = true)
    public List<PwaLotoListItem> list() {
        List<PwaLotoListItem> out = new ArrayList<>();
        for (Loto loto : lotoRepo.findAll()) {
            Phases p = computePhases(loto);
            if (p.phases.isEmpty()) continue;
            out.add(new PwaLotoListItem(loto.getId(), loto.getPermitNumber(), loto.getLotoRequestor(),
                    loto.getEquipmentSystem(), p.status, p.phases,
                    grabInfo(loto.getId(), "HANG"), grabInfo(loto.getId(), "VERIFY"),
                    walkdownService.listForLoto(loto.getId()).size(),
                    p.pointCount, p.hungCount, p.verifiedCount, p.verifyBlockedForMe));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public PwaLotoDetail detail(Long id) {
        Loto loto = lotoRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("LOTO permit not found: " + id));
        LotoSnapshot latest = loto.getLatestSnapshot();
        Map<Long, String> hungBy = latest != null ? latest.getPointHungBy() : Map.of();
        Map<Long, String> hungAt = latest != null ? latest.getPointHungAt() : Map.of();
        Map<Long, String> verBy = latest != null ? latest.getPointVerifiedBy() : Map.of();
        Map<Long, String> verAt = latest != null ? latest.getPointVerifiedAt() : Map.of();
        Map<Long, PointPrerequisite> pre = latest != null ? latest.getPointPrerequisites() : Map.of();

        String me = currentUserName();
        List<PwaLotoPoint> points = new ArrayList<>();
        int idx = 1;
        for (LotoPointIdDto d : loto.getLotoPoints()) {
            Long pid = d.getId();
            PointPrerequisite spec = pre.get(pid);
            // separation-of-duty, surfaced UP FRONT: the user who hung a point may not verify it
            String hb = hungBy.get(pid);
            boolean iHung = hb != null && hb.equals(me);
            points.add(new PwaLotoPoint(pid, idx++, d.getTagNumber(), d.getDescription(),
                    d.getIsoPos(), d.getIsolatedPosition(), d.getNormPos(), d.getNormalPosition(),
                    d.getZeroEnergyMethod(), d.getSpecificLocation(), d.getGeneralLocation(),
                    d.getIsLockable(), d.getIsLabeled(),
                    spec != null ? spec.getInstallRequiredPointIds() : null,
                    spec != null ? spec.getInstallSafetyConditions() : null,
                    hb, hungAt.get(pid), verBy.get(pid), verAt.get(pid),
                    !iHung, iHung ? "You hung this point — another qualified person must verify it." : null));
        }
        boolean canVerifyAny = points.stream().anyMatch(p -> p.verifiedBy() == null && p.canVerify());
        Phases p = computePhases(loto);
        return new PwaLotoDetail(id, loto.getPermitNumber(), loto.getLotoRequestor(), loto.getEquipmentSystem(),
                p.status, p.caApproved, p.aggHung, p.aggVerified, p.phases,
                grabInfo(id, "HANG"), grabInfo(id, "VERIFY"), canVerifyAny, points);
    }

    // ── grab / release (advisory) ──

    @Transactional
    public GrabInfo grab(Long lotoId, String phase) {
        String ph = phase == null ? "" : phase.trim().toUpperCase();
        if (!"HANG".equals(ph) && !"VERIFY".equals(ph)) throw new IllegalArgumentException("Bad phase: " + phase);
        // takeover: retire other active claims for this permit+phase (advisory — SoD is enforced at submit)
        grabRepo.findByLotoIdAndPhaseAndActiveTrue(lotoId, ph).forEach(g -> { g.setActive(false); grabRepo.save(g); });
        User u = currentUser();
        LotoPermitGrab g = new LotoPermitGrab();
        g.setLotoId(lotoId);
        g.setPhase(ph);
        g.setGrabbedBy(currentUserName());
        g.setGrabbedByName(u != null ? u.getName() : currentUserName());
        g.setGrabbedAt(LocalDateTime.now());
        g = grabRepo.save(g);
        return new GrabInfo(ph, g.getGrabbedBy(), g.getGrabbedByName(), g.getGrabbedAt().toString());
    }

    @Transactional
    public void release(Long lotoId, String phase) {
        String ph = phase == null ? "" : phase.trim().toUpperCase();
        grabRepo.findByLotoIdAndPhaseAndActiveTrue(lotoId, ph).forEach(g -> { g.setActive(false); grabRepo.save(g); });
    }

    // ── submit hang (predecessor order; server re-enforces) ──

    public PhaseSubmitResult submitHang(Long lotoId, HangSubmitRequest req) {
        java.util.Set<Long> already = readService.hungPointIds(lotoId);
        int applied = 0, skipped = 0;
        List<String> failures = new ArrayList<>();
        for (PointAck pa : safe(req.points())) {
            if (already.contains(pa.pointId())) { skipped++; continue; } // idempotent re-submit — never overwrite an existing hang
            try {
                ngLotoService.markPointHung(lotoId, pa.pointId(), pa.acknowledged(), pa.notes());
                applied++;
            } catch (Exception e) {
                failures.add("Point " + pa.pointId() + ": " + rootMsg(e));
            }
        }
        boolean signed = false;
        String msg = null;
        if (req.signHung()) {
            try { ngLotoService.markHung(lotoId); signed = true; }
            catch (Exception e) { msg = rootMsg(e); }
        }
        release(lotoId, "HANG");
        return new PhaseSubmitResult(applied, skipped, failures, signed, msg);
    }

    // ── submit verify (any order; server enforces all-hung + hanger≠verifier + safety ack) ──

    public PhaseSubmitResult submitVerify(Long lotoId, VerifySubmitRequest req) {
        java.util.Set<Long> already = readService.verifiedPointIds(lotoId);
        int applied = 0, skipped = 0;
        List<String> failures = new ArrayList<>();
        for (PointAck pa : safe(req.points())) {
            if (already.contains(pa.pointId())) { skipped++; continue; } // idempotent re-submit — never overwrite an existing verify
            try {
                ngLotoService.markPointVerified(lotoId, pa.pointId(), pa.acknowledged(), pa.notes());
                applied++;
            } catch (Exception e) {
                failures.add("Point " + pa.pointId() + ": " + rootMsg(e));
            }
        }
        boolean signed = false;
        String msg = null;
        if (req.signVerified()) {
            try { ngLotoService.markVerified(lotoId); signed = true; }
            catch (Exception e) { msg = rootMsg(e); }
        }
        release(lotoId, "VERIFY");
        return new PhaseSubmitResult(applied, skipped, failures, signed, msg);
    }

    // ── walkdown (repeatable WalkdownSession) ──

    @Transactional
    public PwaWalkdownSession startWalkdown(Long lotoId, WalkdownStartRequest req) {
        WalkdownSession s = walkdownService.requestWalkdown(lotoId,
                req != null ? req.crewName() : null, req != null ? req.notes() : null);
        return toSessionDto(s);
    }

    public PwaWalkdownSession submitWalkdown(Long sessionId, WalkdownSubmitRequest req) {
        List<String> failures = new ArrayList<>();
        for (PointCheck pc : safe(req.points())) {
            try { walkdownService.checkPoint(sessionId, pc.pointId(), pc.checked(), pc.notes()); }
            catch (Exception e) { failures.add("Point " + pc.pointId() + ": " + rootMsg(e)); }
        }
        if (req.complete()) {
            try { walkdownService.completeWalkdown(sessionId, req.notes()); }
            catch (Exception e) { failures.add("Complete: " + rootMsg(e)); }
        }
        // Surface failures so the offline client is NOT told "submitted" and keeps its draft to retry/fix (a rejected
        // session — e.g. not permitted, or already completed by another crew — must not silently clear the draft).
        if (!failures.isEmpty()) throw new IllegalStateException(String.join("; ", failures));
        return getSession(sessionId);
    }

    @Transactional(readOnly = true)
    public List<PwaWalkdownSession> sessions(Long lotoId) {
        return walkdownService.listForLoto(lotoId).stream().map(this::toSessionDto).toList();
    }

    @Transactional(readOnly = true)
    public PwaWalkdownSession getSession(Long sessionId) {
        return toSessionDto(walkdownService.getById(sessionId));
    }

    // ── passthroughs ──

    public PositionOptionsDto positions() { return standardsWalkdown.positionOptions(); }

    public List<com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto> drawings(Long lotoId) {
        return drawingService.drawingsForLoto(lotoId);
    }

    // ── helpers ──

    private record Phases(String status, boolean caApproved, boolean aggHung, boolean aggVerified,
                          List<String> phases, int pointCount, int hungCount, int verifiedCount,
                          boolean verifyBlockedForMe) {}

    private Phases computePhases(Loto loto) {
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        LotoSnapshot latest = loto.getLatestSnapshot();
        Map<Long, String> hungBy = latest != null ? latest.getPointHungBy() : Map.of();
        Map<Long, String> verBy = latest != null ? latest.getPointVerifiedBy() : Map.of();
        List<LotoPointIdDto> pts = loto.getLotoPoints();
        int pointCount = pts.size();
        int hungCount = hungBy.size();
        int verifiedCount = verBy.size();
        boolean caApproved = latest != null && latest.getCaApprovedForHangingBy() != null;
        boolean aggHung = loto.getSnapshots().stream().anyMatch(s -> s.getHungBy() != null);
        boolean aggVerified = loto.getSnapshots().stream().anyMatch(s -> s.getVerifiedBy() != null);
        List<String> phases = new ArrayList<>();
        if ("Building".equals(status) && caApproved && !aggHung) phases.add("HANG");
        if ("Building".equals(status) && aggHung && !aggVerified) phases.add("VERIFY");
        if (aggVerified && !"Closed".equals(status)) phases.add("WALKDOWN");

        // SoD up front: is there ANY still-unverified point this user did NOT hang? If not, they can't verify at all.
        String me = currentUserName();
        boolean canVerifyAny = false;
        for (LotoPointIdDto d : pts) {
            Long pid = d.getId();
            if (verBy.containsKey(pid)) continue;
            String hb = hungBy.get(pid);
            if (hb == null || !hb.equals(me)) { canVerifyAny = true; break; }
        }
        return new Phases(status, caApproved, aggHung, aggVerified, phases, pointCount, hungCount, verifiedCount,
                !canVerifyAny);
    }

    private GrabInfo grabInfo(Long lotoId, String phase) {
        return grabRepo.findByLotoIdAndPhaseAndActiveTrue(lotoId, phase).stream().findFirst()
                .map(g -> new GrabInfo(phase, g.getGrabbedBy(), g.getGrabbedByName(),
                        g.getGrabbedAt() != null ? g.getGrabbedAt().toString() : null))
                .orElse(null);
    }

    private PwaWalkdownSession toSessionDto(WalkdownSession s) {
        List<PwaWalkdownPointState> pts = new ArrayList<>();
        Map<Long, WalkdownSession.PointState> states = s.getPointStates();
        if (states != null) {
            states.forEach((pid, st) -> pts.add(new PwaWalkdownPointState(pid, st.isChecked(),
                    st.getCheckedBy(), st.getCheckedAt(), st.getNotes())));
        }
        return new PwaWalkdownSession(s.getId(), s.getLoto() != null ? s.getLoto().getId() : null,
                s.getCrewName(), s.getStartedBy(), s.getStartedAt() != null ? s.getStartedAt().toString() : null,
                s.isCompleted(), s.getCompletedBy(), s.getCompletedAt() != null ? s.getCompletedAt().toString() : null, pts);
    }

    private User currentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            Object principal = auth.getPrincipal();
            if (principal instanceof CustomUserDetails d) return userRepo.findById(d.getId()).orElse(null);
            String name = auth.getName();
            if (name == null || "anonymousUser".equalsIgnoreCase(name)) return null;
            User u = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(name);
            if (u == null) u = userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(name);
            return u;
        } catch (Exception e) {
            return null;
        }
    }

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private static <T> List<T> safe(List<T> l) { return l == null ? List.of() : l; }

    private static String rootMsg(Throwable e) {
        Throwable c = e;
        while (c.getCause() != null && c.getCause() != c) c = c.getCause();
        String m = c.getMessage();
        return m != null ? m : c.getClass().getSimpleName();
    }
}
