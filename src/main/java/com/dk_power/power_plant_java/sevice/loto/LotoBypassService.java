package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBypassAudit;
import com.dk_power.power_plant_java.entities.users.LotoRole;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.loto.LotoBypassAuditRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.loto.loto_box.LotoAssignmentService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * "Red Tag Bypass" — the one-way service that lets a Control Authority push a
 * LOTO into any lifecycle state (and/or patch a few identity fields) WITHOUT
 * the normal gates (CA-approved-for-hanging, points-all-hung-and-verified,
 * personnel-all-signed-off, ...).
 *
 * <p>The gates exist for good reason on the ordinary lifecycle path — this
 * service intentionally skips them because the operator is telling us "the
 * source of truth is Red Tag, not our local workflow." Every skip is audited
 * ({@link LotoBypassAudit}) with the CA's username, from/to state, the fields
 * patched, and a free-text reason. Audit rows extend {@code BaseIdEntity} so
 * they sync across devices.
 *
 * <p>Called from two entry points:
 * <ul>
 *   <li>the "Red Tag Bypass" button on the LOTO form ({@code source = "MANUAL"}),</li>
 *   <li>the Red-Tag state-sync Apply flow ({@code source = "STATE_SYNC"}).</li>
 * </ul>
 * Both go through the exact same code path, so the audit story is uniform.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LotoBypassService {

    private static final String PERMIT_STATUS_CATEGORY = "Permit Status";

    private final LotoRepo lotoRepo;
    private final LotoBypassAuditRepo auditRepo;
    private final NgValueService ngValueService;
    private final UserRepo userRepo;
    private final NgLotoBoxService lotoBoxService;
    private final LotoAssignmentService lotoAssignmentService;

    /**
     * Perform a bypass. Applies field patches, then (optionally) flips the
     * permit status, then writes one {@link LotoBypassAudit} row. Returns the
     * saved LOTO entity — controllers can convert to DTO as usual.
     *
     * @throws SecurityException if the current user is not Control Authority
     * @throws IllegalArgumentException if {@code reason} is blank
     * @throws EntityNotFoundException if {@code lotoId} does not resolve
     */
    @Transactional
    public Loto bypass(BypassRequest req) {
        Objects.requireNonNull(req, "bypass request required");
        requireControlAuthority();
        if (!notBlank(req.reason())) {
            throw new IllegalArgumentException("Reason is required for a Red Tag Bypass");
        }

        Loto loto = lotoRepo.findById(req.lotoId())
                .orElseThrow(() -> new EntityNotFoundException("LOTO not found: " + req.lotoId()));

        String fromStatus = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
        List<String> changed = new ArrayList<>();

        // Field patches — only apply when the caller explicitly sent a value.
        // Sending {@code null} means "don't touch"; sending blank means the same
        // (never wipe a locally-populated field via bypass).
        if (notBlank(req.workScope()) && !Objects.equals(req.workScope(), loto.getWorkScope())) {
            loto.setWorkScope(req.workScope());
            changed.add("workScope");
        }
        if (notBlank(req.lotoRequestor()) && !Objects.equals(req.lotoRequestor(), loto.getLotoRequestor())) {
            loto.setLotoRequestor(req.lotoRequestor());
            changed.add("lotoRequestor");
        }
        boolean boxChanged = req.boxNumber() != null
                && !Objects.equals(req.boxNumber(), loto.getBoxNumber());
        if (notBlank(req.redTagNum()) && !Objects.equals(req.redTagNum(), loto.getRedTagNum())) {
            loto.setRedTagNum(req.redTagNum());
            changed.add("redTagNum");
        }

        // Status change (bypass — no gate).
        String toStatus = null;
        if (notBlank(req.targetStatus()) && !Objects.equals(req.targetStatus(), fromStatus)) {
            Value statusValue = ngValueService.createValue(PERMIT_STATUS_CATEGORY, req.targetStatus());
            loto.setPermitStatus(statusValue);
            changed.add("permitStatus");
            toStatus = req.targetStatus();
        }

        // A box patch is a physical reassignment, not a scalar edit. This
        // releases the old locks, unlinks/repaints the old box, links the new
        // box, assigns its locks, and paints it using the status set above.
        if (boxChanged) {
            lotoBoxService.changeBox(lotoAssignmentService, loto, req.boxNumber());
            changed.add("boxNumber");
        }

        // Paint only after a possible box move so a combined status+box bypass
        // always targets the new FK. changeBox already paints the current
        // status, but this keeps status-only bypasses on the same final path.
        if (toStatus != null && loto.getLotoBox() != null) {
            try {
                lotoBoxService.updateBoxColorForStatus(loto.getLotoBox(), toStatus);
            } catch (Exception e) {
                log.warn("[BYPASS] Loto {} status → {} succeeded but box color update failed: {}",
                        loto.getId(), toStatus, e.getMessage());
            }
        }

        if (changed.isEmpty()) {
            log.warn("[BYPASS] No-op bypass on LOTO {} by {} (nothing to change)",
                    loto.getId(), currentUserName());
            // Still audit the no-op — the CA explicitly asked for it and the
            // reason is meaningful (e.g. "confirmed nothing to change vs Red Tag").
        }

        Loto saved = lotoRepo.save(loto);

        LotoBypassAudit audit = new LotoBypassAudit();
        audit.setLotoId(saved.getId());
        audit.setLotoPermitNumber(saved.getPermitNumber());
        audit.setAtTime(Instant.now());
        audit.setByUser(currentUserName());
        audit.setFromStatus(fromStatus);
        audit.setToStatus(toStatus);
        audit.setReason(req.reason().trim());
        audit.setSource(notBlank(req.source()) ? req.source().trim() : "MANUAL");
        audit.setChangedFields(String.join(",", changed));
        auditRepo.save(audit);

        log.info("[BYPASS] Loto {} ({}) by {} : {} → {} ; changed=[{}] ; source={}",
                saved.getId(), saved.getPermitNumber(), audit.getByUser(),
                fromStatus, toStatus, audit.getChangedFields(), audit.getSource());
        return saved;
    }

    // --- audit lookups (read-only) ------------------------------------------

    @Transactional(readOnly = true)
    public List<LotoBypassAudit> auditForLoto(Long lotoId) {
        return auditRepo.findByLotoIdNewestFirst(lotoId);
    }

    @Transactional(readOnly = true)
    public List<LotoBypassAudit> recentAudit() {
        return auditRepo.findAllNewestFirst();
    }

    // --- authorisation -------------------------------------------------------

    /**
     * Rejects the call unless the authenticated user has the
     * {@link LotoRole#CONTROL_AUTHORITY} role. Same logic as
     * {@code NgLotoService.requireAnyRole(CONTROL_AUTHORITY)} — we duplicate it
     * here rather than call across into {@code NgLotoService} to keep the DI
     * graph tidy (this service is also injected from the state-sync facade,
     * which itself is injected from the Angular controller, and threading
     * NgLotoService through would round-trip via that class).
     *
     * <p>Public so callers that do non-bypass work under a bypass umbrella
     * (see {@code RedTagStateSyncAutomationService.apply} — a state-sync apply
     * that pre-calls {@code NgLotoService.createFromScratch}) can enforce the
     * gate BEFORE any write, not just at the bypass call itself. Without a
     * pre-check a non-CA request would still get to create the LOTO before
     * being blocked at the follow-up bypass.
     */
    public void requireControlAuthority() {
        User user = currentUser();
        if (user == null) {
            throw new SecurityException("Authentication required for Red Tag Bypass");
        }
        if (user.hasLotoRole(LotoRole.CONTROL_AUTHORITY)) return;
        // Legacy alias — QUALIFIED == CONTROL_AUTHORITY on older user records.
        @SuppressWarnings("deprecation")
        LotoRole legacy = LotoRole.QUALIFIED;
        if (user.hasLotoRole(legacy)) return;
        throw new SecurityException("Red Tag Bypass requires Control Authority");
    }

    private String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private User currentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            Object principal = auth.getPrincipal();
            if (principal instanceof CustomUserDetails details) {
                return userRepo.findById(details.getId()).orElse(null);
            }
            String name = auth.getName();
            if (name == null || name.isBlank()
                    || "anonymousUser".equalsIgnoreCase(name)
                    || "anonymous".equalsIgnoreCase(name)) {
                return null;
            }
            // Last-resort fallbacks — same as NgLotoService.currentUser().
            User u = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(name);
            if (u == null) u = userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(name);
            return u;
        } catch (Exception e) {
            log.warn("[BYPASS] Could not resolve current user: {}", e.getMessage());
            return null;
        }
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }

    /**
     * Immutable bypass request. Any field on this record may be null:
     * <ul>
     *   <li>{@link #targetStatus()} — null means "don't change status";</li>
     *   <li>{@link #workScope()} / {@link #lotoRequestor()} / {@link #redTagNum()}
     *       — null or blank means "don't patch this field";</li>
     *   <li>{@link #boxNumber()} — null means "don't patch box number".</li>
     * </ul>
     * {@link #reason()} is required. {@link #source()} defaults to "MANUAL"
     * when null.
     */
    public record BypassRequest(
            Long lotoId,
            String targetStatus,
            String workScope,
            String lotoRequestor,
            Integer boxNumber,
            String redTagNum,
            String reason,
            String source
    ) {}
}
