package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.config.security.JwtService;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.IcalScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Public ics feed used by third-party calendar apps (Google Calendar / Apple Calendar / Outlook).
 * Auth is folded into the URL as a signed JWT ({@code aud=schedule-ical}) — calendar apps can't
 * send Authorization headers on their poll requests. The auth-gated {@code /api/pwa/secured/
 * schedule/ical/url} endpoint mints the token; this endpoint verifies + serves.
 *
 * <p>Matched by {@code /api/pwa/**} → {@code permitAll} in SecurityConfigSpring, so no session /
 * CSRF is required. Signature validation IS the auth.
 */
@Slf4j
@RestController
@RequestMapping("/api/pwa/public/schedule/ical")
@RequiredArgsConstructor
public class PwaPublicIcalController {

    /** How far back to include events. Small window keeps the feed size manageable and matches
     *  how calendar apps expect an ics subscription to behave — history is not the point. */
    private static final int DAYS_BACK = 30;
    /** Rolling forward window. 180 days = ~6 months. Enough for planning; small enough that a poll
     *  returns quickly. */
    private static final int DAYS_FORWARD = 180;
    /** Plant-local zone — matches {@code IcalScheduleService}, which hard-pins the same zone when
     *  rendering event times. Using the server's default zone here would drift the from/to window
     *  (and thus which days are included) if the hub ever runs somewhere other than Central. */
    private static final ZoneId PLANT_ZONE = ZoneId.of("America/Chicago");

    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final IcalScheduleService icalScheduleService;

    /**
     * Serve the calendar feed. Path is {@code {token}.ics} so URL rewriters + client-side heuristics
     * see the ".ics" extension and route to the calendar app.
     */
    @GetMapping(value = "/{token:.+}.ics", produces = "text/calendar; charset=utf-8")
    public ResponseEntity<?> feed(@PathVariable String token) {
        JwtService.IcalTokenClaims claims;
        try {
            claims = jwtService.verifyIcalTokenClaims(token);
        } catch (Exception e) {
            log.debug("[Ical] token verification failed: {}", e.getMessage());
            return ResponseEntity.status(401).body("iCal token invalid or expired.");
        }

        User user = userRepo.findById(claims.userId()).orElse(null);
        if (user == null || Boolean.FALSE.equals(user.getIsActive())) {
            return ResponseEntity.status(404).body("User not found or inactive.");
        }

        // Per-user revocation nonce: a token minted before the user's last "regenerate my
        // calendar link" carries a stale (or absent, i.e. 0) tokenVersion and is rejected here —
        // no fleet-wide key rotation needed. Missing user value defaults to 0, matching a token
        // minted before this field existed, so pre-existing live subscriptions keep working.
        int currentVersion = user.getIcalTokenVersion() == null ? 0 : user.getIcalTokenVersion();
        if (claims.tokenVersion() != currentVersion) {
            log.debug("[Ical] token version mismatch for user {} (token={}, current={}) — revoked",
                    user.getId(), claims.tokenVersion(), currentVersion);
            return ResponseEntity.status(401).body("iCal link has been regenerated; request a new subscription URL.");
        }

        LocalDate today = LocalDate.now(PLANT_ZONE);
        LocalDate from = today.minusDays(DAYS_BACK);
        LocalDate to = today.plusDays(DAYS_FORWARD);
        String body = icalScheduleService.buildFeed(user, from, to);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
                .body(body);
    }
}
