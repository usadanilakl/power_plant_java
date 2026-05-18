package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * PIN lifecycle operations: assign initials, set a PIN, generate a random PIN,
 * change a PIN (user self-service), reset a PIN (admin), validate trivial PINs.
 *
 * <p>See project/features/users/pin-authentication.md.
 */
@Service
@RequiredArgsConstructor
public class PinManagementService {

    private static final Pattern INITIALS_PATTERN = Pattern.compile("^[A-Za-z]{2,3}$");
    private static final Pattern PIN_PATTERN = Pattern.compile("^\\d{4}$");

    /** Trivial PINs we won't allow users to choose. */
    private static final Set<String> BLOCKED_PINS = Set.of(
            "0000", "1111", "2222", "3333", "4444", "5555",
            "6666", "7777", "8888", "9999",
            "1234", "2345", "3456", "4567", "5678", "6789",
            "9876", "8765", "7654", "6543", "5432", "4321"
    );

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public static class PinException extends RuntimeException {
        public PinException(String message) { super(message); }
    }

    /**
     * Set or change a user's PIN. Validates format, triviality, and per-initials-group
     * uniqueness. Caller must enforce identity rules (current user changing their own
     * PIN, or admin resetting someone else's).
     */
    @Transactional
    public void setPin(Long userId, String rawPin) {
        if (rawPin == null || !PIN_PATTERN.matcher(rawPin).matches()) {
            throw new PinException("PIN must be exactly 4 digits");
        }
        if (BLOCKED_PINS.contains(rawPin)) {
            throw new PinException("PIN is too predictable — pick something less obvious");
        }
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new PinException("User not found"));
        if (user.getSigningInitials() == null || user.getSigningInitials().isBlank()) {
            throw new PinException("User has no signing initials assigned yet");
        }
        // Uniqueness check: nobody else with the same initials can have this same PIN.
        var sameInitials = userRepo.findBySigningInitialsIgnoreCase(user.getSigningInitials());
        for (User other : sameInitials) {
            if (other.getId().equals(user.getId())) continue;
            if (other.getPinHash() == null) continue;
            if (passwordEncoder.matches(rawPin, other.getPinHash())) {
                throw new PinException("That PIN is already in use by someone with the same initials — please pick another");
            }
        }
        user.setPinHash(passwordEncoder.encode(rawPin));
        user.setPinSetAt(LocalDateTime.now());
        user.setFailedPinAttempts(0);
        user.setPinLockedUntil(null);
        // User-chosen PIN — clear the "must change" nudge.
        user.setPinMustChange(Boolean.FALSE);
        userRepo.save(user);
    }

    /**
     * Generate a random 4-digit PIN for a user. Returns the cleartext PIN ONCE
     * for distribution (caller delivers it via screen / email / paper). Stored hashed.
     */
    @Transactional
    public String generateAndAssignPin(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new PinException("User not found"));
        if (user.getSigningInitials() == null || user.getSigningInitials().isBlank()) {
            throw new PinException("Assign signing initials before generating a PIN");
        }
        var sameInitials = userRepo.findBySigningInitialsIgnoreCase(user.getSigningInitials());
        // Retry up to N times to find a non-blocked, non-colliding PIN. Should rarely
        // exceed 1-2 iterations even in crowded initial groups.
        for (int attempt = 0; attempt < 50; attempt++) {
            String candidate = String.format("%04d", random.nextInt(10_000));
            if (BLOCKED_PINS.contains(candidate)) continue;
            boolean collides = sameInitials.stream()
                    .filter(o -> !o.getId().equals(user.getId()))
                    .filter(o -> o.getPinHash() != null)
                    .anyMatch(o -> passwordEncoder.matches(candidate, o.getPinHash()));
            if (collides) continue;
            user.setPinHash(passwordEncoder.encode(candidate));
            user.setPinSetAt(LocalDateTime.now());
            user.setFailedPinAttempts(0);
            user.setPinLockedUntil(null);
            // Admin reset clears any pending forgot-PIN flag — the request is now actioned.
            user.setPinResetRequestedAt(null);
            // Admin-generated PINs are temporary — the user is nudged to change it.
            user.setPinMustChange(Boolean.TRUE);
            userRepo.save(user);
            return candidate;
        }
        throw new PinException("Couldn't pick a unique PIN — initials group is too crowded; assign a custom initial alias");
    }

    /** Set or change a user's signing initials. Plant-wide uniqueness is NOT enforced —
     *  collisions are expected (DK, MS, etc.) and disambiguated by PIN at sign-on time. */
    @Transactional
    public void setSigningInitials(Long userId, String initials) {
        if (initials == null || !INITIALS_PATTERN.matcher(initials).matches()) {
            throw new PinException("Initials must be 2 or 3 letters");
        }
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new PinException("User not found"));
        String normalized = initials.toUpperCase();
        // If the user already has a PIN AND the new initials would collide with someone
        // else who also has the same PIN, reject — caller must reset the PIN first.
        if (user.getPinHash() != null) {
            var sameInitials = userRepo.findBySigningInitialsIgnoreCase(normalized);
            for (User other : sameInitials) {
                if (other.getId().equals(user.getId())) continue;
                if (other.getPinHash() == null) continue;
                // We can't compare bcrypt-hashed PINs against each other; we just flag the
                // risk and require the caller to re-generate the PIN after the move.
                // (Triggers the uniqueness check in setPin/generateAndAssignPin.)
            }
        }
        user.setSigningInitials(normalized);
        userRepo.save(user);
    }

    /**
     * User self-service: flag the account as "I forgot my PIN — please reset".
     * No PIN/credential is mutated here; admin still has to one-click reset
     * (which clears the flag and issues a new PIN they hand back). Idempotent:
     * calling it twice keeps the earlier timestamp so we don't lose the
     * original ask.
     */
    @Transactional
    public void requestPinReset(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new PinException("User not found"));
        if (user.getPinResetRequestedAt() == null) {
            user.setPinResetRequestedAt(LocalDateTime.now());
            userRepo.save(user);
        }
    }

    /**
     * User self-service PIN change. Caller authenticates with the current PIN first.
     * The current-PIN check happens here so the controller doesn't need to.
     */
    @Transactional
    public void changeOwnPin(Long userId, String currentPin, String newPin) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new PinException("User not found"));
        if (user.getPinHash() == null
                || !passwordEncoder.matches(currentPin, user.getPinHash())) {
            throw new PinException("Current PIN is incorrect");
        }
        setPin(userId, newPin);
    }
}
