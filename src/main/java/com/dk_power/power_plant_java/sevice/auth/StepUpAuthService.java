package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Per-request "act-as" authentication: validates a combined initials+PIN code
 * and issues a single-use {@link StepUpTokenStore.Token} for one upstream
 * action. See project/features/users/pin-authentication.md.
 *
 * <p>Lockout: 3 consecutive failed attempts → 5 minute lock per user. Wider
 * IP-level rate limiting belongs in a filter (added separately).
 */
@Service
@RequiredArgsConstructor
public class StepUpAuthService {

    /** Format: 2 letters + 4 digits (e.g. "DK1234"). Trimmed and uppercased at entry. */
    private static final Pattern CODE_PATTERN = Pattern.compile("^([A-Z]{2,3})(\\d{4,6})$");

    public static final int MAX_FAILED_ATTEMPTS = 3;
    public static final java.time.Duration LOCKOUT_DURATION = java.time.Duration.ofMinutes(5);

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final StepUpTokenStore tokenStore;

    public static class StepUpException extends RuntimeException {
        public StepUpException(String message) { super(message); }
    }

    /**
     * Validate a combined code (e.g. "DK1234"). On success, issue a step-up token
     * bound to the matching user and return it. On failure, throw with a generic
     * message — do NOT leak whether the initials were known.
     */
    @Transactional
    public StepUpTokenStore.Token authorize(String code) {
        String normalized = normalize(code);
        ParsedCode parsed = parse(normalized);

        List<User> candidates = userRepo.findBySigningInitialsIgnoreCase(parsed.initials());
        if (candidates.isEmpty()) {
            throw new StepUpException("Invalid code");
        }

        User match = null;
        for (User u : candidates) {
            if (isLocked(u)) continue; // skip locked accounts; effectively never matches
            String hash = u.getPinHash();
            if (hash == null || hash.isBlank()) continue;
            if (passwordEncoder.matches(parsed.pin(), hash)) {
                if (match != null) {
                    // Two users with the same initials AND the same PIN — should be
                    // prevented at PIN-set time, but fail safe if it slips through.
                    throw new StepUpException("Code is ambiguous — contact an administrator");
                }
                match = u;
            }
        }

        if (match == null) {
            // Record a failed attempt against every non-locked candidate with the
            // same initials. Caps blast radius — only that subset of users
            // accrues lockouts, not the entire database.
            for (User u : candidates) {
                if (isLocked(u)) continue;
                int attempts = (u.getFailedPinAttempts() == null ? 0 : u.getFailedPinAttempts()) + 1;
                u.setFailedPinAttempts(attempts);
                if (attempts >= MAX_FAILED_ATTEMPTS) {
                    u.setPinLockedUntil(LocalDateTime.now().plus(LOCKOUT_DURATION));
                }
                userRepo.save(u);
            }
            throw new StepUpException("Invalid code");
        }

        // Success — clear lockout state and issue token.
        match.setFailedPinAttempts(0);
        match.setPinLockedUntil(null);
        userRepo.save(match);
        return tokenStore.issue(match.getUsername());
    }

    private record ParsedCode(String initials, String pin) {}

    private ParsedCode parse(String code) {
        var m = CODE_PATTERN.matcher(code);
        if (!m.matches()) throw new StepUpException("Invalid code format");
        return new ParsedCode(m.group(1), m.group(2));
    }

    private String normalize(String raw) {
        if (raw == null) throw new StepUpException("Code required");
        String t = raw.trim().toUpperCase();
        if (t.isEmpty()) throw new StepUpException("Code required");
        return t;
    }

    private boolean isLocked(User u) {
        var until = u.getPinLockedUntil();
        return until != null && LocalDateTime.now().isBefore(until);
    }
}
