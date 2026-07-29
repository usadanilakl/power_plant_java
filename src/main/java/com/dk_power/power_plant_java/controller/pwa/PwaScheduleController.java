package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import com.dk_power.power_plant_java.config.security.JwtService;
import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.ShiftDayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
 * PWA-facing read-only schedule endpoints. Gated to plant-group roles via {@code @PreAuthorize}
 * — contractors deliberately do not see the plant schedule. Range queries are capped server-side
 * to prevent runaway pulls when the PWA is offline-caching aggressively.
 *
 * See {@code project/features/users/communication/pwa-step-5-wiring.md}.
 */
@RestController
@RequestMapping("/api/pwa/secured/schedule")
@RequiredArgsConstructor
@Slf4j
public class PwaScheduleController {

    /** Server-enforced maximum range width for {@link #range}. Prevents accidental year-long pulls. */
    private static final int MAX_RANGE_DAYS = 60;

    private final ShiftDayService shiftDayService;
    private final JwtService jwtService;
    private final UserRepo userRepo;

    /**
     * Public base URL a calendar app will use to poll the ics feed. Defaults to the hub's own URL
     * ({@code sync.server.url}) since ical clients need a stable public host — see
     * {@code reference_hub_public_url.md}. If unset, we fall back to a relative path so the URL
     * still works when opened from a browser tab on the hub.
     */
    @Value("${schedule.ical.public-base-url:${sync.server.url:}}")
    private String icalPublicBaseUrl;

    @GetMapping("/today")
public ResponseEntity<ShiftDayDto> today() {
        ShiftDayDto dto = shiftDayService.getByDate(LocalDate.now());
        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    @GetMapping("/range")
public ResponseEntity<?> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (to.isBefore(from)) {
            return ResponseEntity.badRequest().body(Map.of("error", "'to' must be on or after 'from'"));
        }
        long span = ChronoUnit.DAYS.between(from, to) + 1;
        if (span > MAX_RANGE_DAYS) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Range exceeds " + MAX_RANGE_DAYS + " days (requested " + span + ")"));
        }
        return ResponseEntity.ok(shiftDayService.getRange(from, to));
    }

    /**
     * Compact "who is on shift right now" list — Day/Night entries only, no PTO/training/OCM.
     * Cheaper than pulling the full {@link ShiftDayDto} client-side just to filter.
     */
    /**
     * All ShiftDay rows for a single calendar year — used by the year-at-a-glance view. Returns
     * an empty list rather than 400 for years with no data yet (so a New Year's first-load doesn't
     * error while data is still propagating).
     */
    @GetMapping("/year/{year}")
    public ResponseEntity<List<ShiftDayDto>> year(@org.springframework.web.bind.annotation.PathVariable int year) {
        if (year < 2000 || year > 2100) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(shiftDayService.getYear(year));
    }

    @GetMapping("/on-shift-now")
public ResponseEntity<List<ShiftEntry>> onShiftNow() {
        ShiftDayDto today = shiftDayService.getByDate(LocalDate.now());
        if (today == null) return ResponseEntity.ok(List.of());
        // 5am–5pm is Day; else Night. Matches Electron's PersonnelManager convention.
        int hour = java.time.LocalTime.now().getHour();
        boolean isDay = hour >= 5 && hour < 17;
        List<ShiftEntry> pool = isDay ? today.getDayShift() : today.getNightShift();
        return ResponseEntity.ok(pool == null ? List.of() : pool);
    }

    /**
     * Return this user's personal iCal subscription URL. The URL contains a long-lived signed JWT
     * ({@code aud=schedule-ical}) so third-party calendar apps (Google Calendar / Apple Calendar /
     * Outlook) can poll it without sending Authorization headers.
     *
     * <p>Idempotent — the JWT is deterministically derived from the user id + the hub's private
     * key, so hitting this endpoint again just returns the same URL. To rotate a link, the hub
     * admin rotates the hub JWT key.
     */
    @GetMapping("/ical/url")
    public ResponseEntity<?> icalSubscribeUrl() {
        User me = currentUser();
        if (me == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));
        String token = jwtService.generateIcalToken(me);
        String base = (icalPublicBaseUrl == null || icalPublicBaseUrl.isBlank())
                ? "" : icalPublicBaseUrl.replaceAll("/$", "");
        String url = base + "/api/pwa/public/schedule/ical/" + token + ".ics";
        // "webcal://" scheme triggers Apple Calendar / Outlook one-click subscribe; some browsers
        // auto-hand it to Calendar without the round-trip through a copy-paste.
        String webcal = url.replaceFirst("^https?://", "webcal://");
        return ResponseEntity.ok(Map.of(
                "url", url,
                "subscribeUrl", webcal,
                "instructions", "Copy this URL into Google Calendar → 'From URL', Apple Calendar → File → New Subscription, or Outlook → 'Add from web'"
        ));
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails userDetails)) return null;
        return userRepo.findById(userDetails.getId()).orElse(null);
    }
}
