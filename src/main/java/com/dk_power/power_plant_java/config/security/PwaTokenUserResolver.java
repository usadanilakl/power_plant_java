package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Resolves the account a *already-validated* token belongs to.
 *
 * <p>Only keys that are unique per person are ever used:
 * <ul>
 *   <li><b>hub tokens</b> — the {@code userId} claim. Exact, and it works for accounts with no
 *       email (sign-in accepts an email OR a username, so email-less rows are legitimate).</li>
 *   <li><b>Supabase tokens</b> — {@code supabaseUuid} then {@code email}, both {@code unique = true}
 *       on the entity.</li>
 * </ul>
 *
 * <p>The {@code username} column is deliberately NOT consulted: it carries no unique constraint and
 * normally holds the user's email address (see {@code PwaUserService} / {@code SyncAtLoginService},
 * which both set {@code username = email}), so matching a token against it could resolve to a
 * different person than the token was issued for.
 */
@Component
@RequiredArgsConstructor
public class PwaTokenUserResolver {

    private final JwtService jwtService;
    private final UserRepo userRepo;

    /** @return the account, or null when the token maps to no (live) row, or is not a session token. */
    public User resolve(Claims claims) {
        // A hub signature alone does not make a token a session credential — the 90-day schedule-ical
        // subscription token is hub-issued, RS256-signed and carries the same userId claim, yet it is
        // designed to be pasted into third-party calendar apps. See JwtService#isSessionToken.
        if (!jwtService.isSessionToken(claims)) return null;

        if (jwtService.isHubIssued(claims)) {
            Long userId = extractUserId(claims);
            if (userId != null) {
                // A miss here means the row is gone or soft-deleted — that must NOT fall through to
                // a looser lookup, it must end the session.
                return userRepo.findById(userId).orElse(null);
            }
            // Pre-dates the userId claim: fall back to the unique email column only.
        }

        String subject = claims.getSubject();
        if (subject != null && !subject.isBlank()) {
            User bySupabaseUuid = userRepo.findFirstBySupabaseUuidOrderByIdAsc(subject);
            if (bySupabaseUuid != null) return bySupabaseUuid;
        }

        String email = jwtService.extractEmail(claims);
        return email == null || email.isBlank()
                ? null
                : userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(email);
    }

    private Long extractUserId(Claims claims) {
        Object raw = claims.get("userId");
        if (raw instanceof Number n) return n.longValue();
        if (raw instanceof String s && !s.isBlank()) {
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
