package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pwa.PwaRegistrationResult;
import com.dk_power.power_plant_java.dto.pwa.PwaUserRegistrationDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.enums.PermissionLevel;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaUserService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final com.dk_power.power_plant_java.sevice.auth.SyncAtLoginService syncAtLoginService;

    public PwaRegistrationResult registerPwaUser(PwaUserRegistrationDto dto) {
        // This is a public endpoint. Without these, a missing field reaches dto.getName().indexOf(' ')
        // as an NPE, or inserts a null email that the UNIQUE index accepts exactly once and then
        // rejects for everyone after — either way the caller gets a stack trace instead of an answer.
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            return PwaRegistrationResult.error("An email address is required.");
        }
        if (dto.getName() == null || dto.getName().isBlank()) {
            return PwaRegistrationResult.error("A name is required.");
        }
        if (dto.getPassword() == null || dto.getPassword().length() < 8) {
            return PwaRegistrationResult.error("Password must be at least 8 characters.");
        }
        dto.setEmail(dto.getEmail().trim());
        dto.setName(dto.getName().trim());

        // pwaUserUuid identifies the DEVICE/browser install, not the person: the PWA stores one uuid
        // in localStorage forever and hands the same one back for every signup on that device.
        // So it is only an idempotency key when the email matches too.
        User existing = userRepo.findFirstByPwaUserUuidOrderByIdAsc(dto.getPwaUserUuid());
        if (existing != null && sameEmail(existing.getEmail(), dto.getEmail())) {
            log.info("[PWA User] Already registered: pwaUserUuid={}", dto.getPwaUserUuid());
            return PwaRegistrationResult.alreadyExists(
                    Boolean.TRUE.equals(existing.getIsActive()), existing.getPwaUserUuid());
        }

        // Identity check, case-insensitively: sign-in resolves the account with
        // findFirstByEmailIgnoreCase, so two rows differing only in case would be one identity with
        // two accounts, and only the lower id would ever be reachable.
        if (userRepo.existsByEmailIgnoreCase(dto.getEmail())) {
            log.info("[PWA User] Email already taken: email={}", dto.getEmail());
            return PwaRegistrationResult.emailTaken();
        }
        // No LIVE row holds it, but the UNIQUE index on users.email counts soft-deleted rows too and
        // this insert would die on a raw 23505. Exact-case here because that is what the index
        // compares — anything it matches now can only be a tombstone.
        if (userRepo.countAnyByEmailIncludingDeleted(dto.getEmail()) > 0) {
            log.info("[PWA User] Email held by a deleted account: email={}", dto.getEmail());
            return PwaRegistrationResult.emailHeldByDeletedAccount();
        }

        // Resolve a uuid that the UNIQUE index will actually accept. It is taken when ANOTHER person
        // registered from this device, or when a soft-deleted row still owns it (invisible to JPA,
        // enforced by the DB). Mint a fresh one rather than mutating the old row — the value is just
        // a device identifier, and rewriting a deleted row would diverge from the other sync nodes.
        String pwaUserUuid = resolveFreePwaUserUuid(dto.getPwaUserUuid());

        // Split name into first/last
        String firstName = dto.getName();
        String lastName = "";
        int spaceIdx = dto.getName().indexOf(' ');
        if (spaceIdx > 0) {
            firstName = dto.getName().substring(0, spaceIdx);
            lastName = dto.getName().substring(spaceIdx + 1);
        }

        User user = User.builder()
                .username(dto.getEmail())
                .name(dto.getName())
                .firstName(firstName)
                .lastName(lastName)
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .company(dto.getCompany())
                .password(passwordEncoder.encode(dto.getPassword()))
                .role("PWA_USER")
                .isActive(false)
                .pwaUserUuid(pwaUserUuid)
                .permissionLevel(PermissionLevel.NONE)
                .passwordUpdatedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC))
                .build();

        userRepo.save(user);
        // Hub write succeeded — fire-and-forget the Supabase mirror (creates the Supabase user with
        // this plaintext + metadata). If Supabase is down, the 60s reconciliation job / next login
        // catches it up. See dual-auth.md.
        syncAtLoginService.mirrorPasswordChangeAsync(user.getId(), dto.getPassword());
        if (!pwaUserUuid.equals(dto.getPwaUserUuid())) {
            log.info("[PWA User] Reassigned pwaUserUuid: requested={} assigned={} (already in use)",
                    dto.getPwaUserUuid(), pwaUserUuid);
        }
        log.info("[PWA User] Registered new user: email={}, pwaUserUuid={}", dto.getEmail(), pwaUserUuid);
        // The assigned uuid is echoed back: it may differ from the one the client sent, and the client
        // keys its follow-up signature upload and status polling on it.
        return PwaRegistrationResult.success(pwaUserUuid);
    }

    /** True when both sides have an email and they match case-insensitively. */
    private boolean sameEmail(String a, String b) {
        return a != null && b != null && a.equalsIgnoreCase(b.trim());
    }

    /**
     * Returns the requested uuid when no row (visible OR soft-deleted) holds it, otherwise a fresh
     * one. Counting through native SQL is deliberate — {@code @Where(deleted IS NOT TRUE)} on User
     * hides exactly the rows that still own the UNIQUE index entry.
     */
    private String resolveFreePwaUserUuid(String requested) {
        if (requested != null && !requested.isBlank()
                && userRepo.countAnyByPwaUserUuidIncludingDeleted(requested) == 0) {
            return requested;
        }
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = java.util.UUID.randomUUID().toString();
            if (userRepo.countAnyByPwaUserUuidIncludingDeleted(candidate) == 0) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not allocate a free pwaUserUuid");
    }

    public Map<String, Object> getRegistrationStatus(String pwaUserUuid) {
        User user = userRepo.findFirstByPwaUserUuidOrderByIdAsc(pwaUserUuid);
        if (user == null) {
            return null;
        }
        return Map.of(
                "registered", true,
                "isActive", Boolean.TRUE.equals(user.getIsActive()),
                "permissionLevel", user.getPermissionLevel() != null ? user.getPermissionLevel() : PermissionLevel.NONE
        );
    }
}
