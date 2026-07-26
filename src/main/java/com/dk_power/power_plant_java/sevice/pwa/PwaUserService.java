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
        // Idempotent: check if already registered by pwaUserUuid
        User existing = userRepo.findFirstByPwaUserUuidOrderByIdAsc(dto.getPwaUserUuid());
        if (existing != null) {
            log.info("[PWA User] Already registered: pwaUserUuid={}", dto.getPwaUserUuid());
            return PwaRegistrationResult.alreadyExists(Boolean.TRUE.equals(existing.getIsActive()));
        }

        // Check email uniqueness
        if (userRepo.existsByEmail(dto.getEmail())) {
            log.info("[PWA User] Email already taken: email={}", dto.getEmail());
            return PwaRegistrationResult.emailTaken();
        }

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
                .pwaUserUuid(dto.getPwaUserUuid())
                .permissionLevel(PermissionLevel.NONE)
                .passwordUpdatedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC))
                .build();

        userRepo.save(user);
        // Hub write succeeded — fire-and-forget the Supabase mirror (creates the Supabase user with
        // this plaintext + metadata). If Supabase is down, the 60s reconciliation job / next login
        // catches it up. See dual-auth.md.
        syncAtLoginService.mirrorPasswordChangeAsync(user.getId(), dto.getPassword());
        log.info("[PWA User] Registered new user: email={}, pwaUserUuid={}", dto.getEmail(), dto.getPwaUserUuid());
        return PwaRegistrationResult.success();
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
