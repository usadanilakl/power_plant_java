package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.sync.SyncContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserSeeder {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final SyncContext syncContext;
    private final SyncConfig syncConfig;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedAdminUser() {
        // Wrap in SyncContext to suppress FieldChange generation.
        // Seeded admin users are local bootstrap data — they should NOT sync to other machines.
        // Each machine (including hub) creates its own local admin independently on startup.
        syncContext.executeInSyncContext(() -> {
            try {
                seedUsers();
            } catch (Exception e) {
                log.error("Admin user seeder failed (non-fatal): {}", e.getMessage());
            }
        });
    }

    private void seedUsers() {
        // Check by windowsUsername (not email) to detect both seeded and synced users.
        // If sync has already brought the real user, skip seeding to avoid email conflicts.
        seedIfMissing("usada", "admin", "System", "Administrator");
        seedIfMissing("dklokov", "dklokov", "D", "Klokov");
    }

    private void seedIfMissing(String windowsUsername, String username, String firstName, String lastName) {
        User existing = userRepo.findFirstByWindowsUsernameOrderByIdAsc(windowsUsername);
        if (existing != null) {
            log.info("User with windowsUsername='{}' already exists ({}), skipping seed",
                     windowsUsername, existing.getEmail());
            return;
        }

        // Use machine-specific email to avoid unique constraint conflicts when synced users
        // arrive from other machines with the same logical email (e.g., admin@power-plant.local)
        String machineId = syncConfig.getMachineId();
        String email = username + "-" + machineId + "@localhost";

        User user = User.builder()
            .username(username)
            .firstName(firstName)
            .lastName(lastName)
            .name(firstName + " " + lastName)
            .email(email)
            .role("ROLE_ADMIN")
            .password(passwordEncoder.encode("admin"))
            .isActive(true)
            .windowsUsername(windowsUsername)
            .build();

        userRepo.save(user);
        log.info("Admin user created: {} (windowsUsername={})", email, windowsUsername);
    }
}
