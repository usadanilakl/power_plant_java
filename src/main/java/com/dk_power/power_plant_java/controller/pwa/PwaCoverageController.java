package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.dto.schedule.CoverageRequestDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSeatSummaryDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSignupDto;
import com.dk_power.power_plant_java.dto.schedule.EligibilityCellDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.schedule.NgCoverageService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Operator-facing coverage endpoints (PWA / Electron / kiosk). Reads expose the open-seat chips and
 * per-day detail; the POST signs the authenticated user up for a seat. Gated in
 * {@code SecurityConfigSpring} — GET is PLANT/ADMIN/KIOSK (a kiosk wall display may show open
 * seats); POST (signup) is PLANT/ADMIN only. KIOSK is deliberately excluded from the POST: the
 * shared kiosk JWT identifies the display, not the individual, so a kiosk signup today would be
 * misattributed.
 *
 * <p>Kiosk PIN-based signup (identifying the individual by initials+PIN via {@code StepUpAuthService}
 * / the {@code X-Sign-As-Token} step-up path rather than the shared kiosk JWT) is the planned
 * Phase 3B route back to kiosk signup; until it's built, the POST attributes the signup to the
 * authenticated (non-kiosk) principal only.
 */
@RestController
@RequestMapping("/api/pwa/secured/coverage-signup")
@RequiredArgsConstructor
@Slf4j
public class PwaCoverageController {

    private static final int MAX_RANGE_DAYS = 90;

    private final NgCoverageService coverageService;
    private final UserRepo userRepo;

    /** Per-day open-seat chip data across a bounded range. */
    @GetMapping("/open")
    public ResponseEntity<List<CoverageSeatSummaryDto>> open(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) + 1 > MAX_RANGE_DAYS) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(coverageService.seatSummary(from, to));
    }

    /** Open coverage requests on a single day, each with remaining open seats — the day-detail list. */
    @GetMapping("/day")
    public ResponseEntity<List<CoverageRequestDto>> day(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(coverageService.openForDate(date));
    }

    /**
     * Open needs on a day that the SIGNED-IN operator may actually pick up — off that day AND qualified
     * by the cover-up hierarchy (Lead>CRO>AO; same-discipline for Mechanic/I&C/Manager). The self-service
     * "help cover a shift" list, so an operator only sees seats they can fill; each carries the
     * discipline/position so the card can be labelled.
     */
    @GetMapping("/day-eligible")
    public ResponseEntity<List<CoverageRequestDto>> dayEligible(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User me = currentUser();
        if (me == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(coverageService.openForDateForUser(date, me));
    }

    /**
     * One-click sign-up from the schedule grid: sign the current operator up for the best open need
     * they can cover on {@code date} (auto-picks the seat matching their position). Drives clicking the
     * ＋ next to their name. Returns the PENDING signup, or 400 with an error if nothing is coverable.
     */
    @PostMapping("/quick")
    public ResponseEntity<?> quick(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String via) {
        User me = currentUser();
        if (me == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));
        try {
            return ResponseEntity.ok(coverageService.quickSignUp(date, shift, me, via == null ? "PWA" : via));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Withdraw the current operator's own not-yet-approved sign-up (change/remove a pending pick-up). */
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable Long id) {
        User me = currentUser();
        if (me == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));
        try {
            boolean ok = coverageService.withdrawSignup(id, me);
            return ResponseEntity.ok(Map.of("ok", ok));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** All coverage signups over a range (any status) — drives the grid status colouring
     *  (pending vs approved letter on each person's cell). */
    @GetMapping("/signups")
    public ResponseEntity<List<CoverageSignupDto>> signups(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) + 1 > MAX_RANGE_DAYS) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(coverageService.listSignups(from, to));
    }

    /** Per-person day/night open-seat counts across a range — the grid seat marker (green day count /
     *  blue night count / half-and-half when both). Replaces the old boolean ＋ eligibility. */
    @GetMapping("/eligibility-detail")
    public ResponseEntity<List<EligibilityCellDto>> eligibilityDetail(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) + 1 > MAX_RANGE_DAYS) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(coverageService.eligibilityDetail(from, to));
    }

    /** Dates in the range the signed-in operator can cover (off that day + qualified by the hierarchy). */
    @GetMapping("/my-eligible")
    public ResponseEntity<List<String>> myEligible(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        User me = currentUser();
        if (me == null) return ResponseEntity.status(401).build();
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) + 1 > MAX_RANGE_DAYS) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(coverageService.eligibleDatesForUser(me.getId(), from, to)
                .stream().map(LocalDate::toString).toList());
    }

    /**
     * Roster-wide eligibility: date -> user ids who are off that day and qualified to cover.
     * Drives the per-person "can pick up" markers in the month grid (every operator, not just self).
     */
    @GetMapping("/eligibility")
    public ResponseEntity<Map<String, List<Long>>> eligibility(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) + 1 > MAX_RANGE_DAYS) {
            return ResponseEntity.badRequest().build();
        }
        Map<String, List<Long>> out = new java.util.LinkedHashMap<>();
        coverageService.eligibleCoverersByDate(from, to)
                .forEach((d, ids) -> out.put(d.toString(), new java.util.ArrayList<>(ids)));
        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<?> signUp(@RequestBody SignupRequest req) {
        User me = currentUser();
        if (me == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));
        if (req == null || req.coverageRequestId() == null || req.date() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "coverageRequestId and date are required"));
        }
        try {
            CoverageSignupDto dto = coverageService.signUp(
                    req.coverageRequestId(), req.date(), me, req.via() == null ? "PWA" : req.via());
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud)) return null;
        return userRepo.findById(cud.getId()).orElse(null);
    }

    public record SignupRequest(Long coverageRequestId, LocalDate date, String via) {}
}
