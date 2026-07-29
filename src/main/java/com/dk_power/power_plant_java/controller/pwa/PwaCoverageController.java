package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.dto.schedule.CoverageRequestDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSeatSummaryDto;
import com.dk_power.power_plant_java.dto.schedule.CoverageSignupDto;
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
 * {@code SecurityConfigSpring} to PLANT/ADMIN/KIOSK so a kiosk (read-only elsewhere) may sign up.
 *
 * <p>Kiosk PIN-based signup (identifying the individual by initials+PIN via {@code StepUpAuthService}
 * rather than the shared kiosk JWT) is a Phase 3B addition; today the POST attributes the signup to
 * the authenticated principal.
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
