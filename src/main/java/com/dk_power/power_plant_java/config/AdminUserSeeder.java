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

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedAdminUser() {
        // Wrap in SyncContext to suppress FieldChange generation.
        // Seeded admin users are local bootstrap data — they should NOT sync to other machines.
        // Each machine (including hub) creates its own local admin independently on startup.
        syncContext.executeInSyncContext(() -> seedUsers());
    }

    private void seedUsers() {
        String adminEmail = "admin@power-plant.local";

        if (userRepo.findByEmail(adminEmail) != null) {
            log.info("Default admin user already exists, skipping seed");
            return;
        }

        User admin = User.builder()
            .username("admin")
            .firstName("System")
            .lastName("Administrator")
            .name("System Administrator")
            .email(adminEmail)
            .role("ROLE_ADMIN")
            .password(passwordEncoder.encode("admin"))
            .isActive(true)
            .windowsUsername("usada")
            .build();

        userRepo.save(admin);
        log.info("Default admin user created: {} (windowsUsername=usada)", adminEmail);

        // Second admin
        String dkEmail = "dklokov@power-plant.local";
        if (userRepo.findByEmail(dkEmail) == null) {
            User dk = User.builder()
                .username("dklokov")
                .firstName("D")
                .lastName("Klokov")
                .name("D Klokov")
                .email(dkEmail)
                .role("ROLE_ADMIN")
                .password(passwordEncoder.encode("admin"))
                .isActive(true)
                .windowsUsername("dklokov")
                .build();
            userRepo.save(dk);
            log.info("Admin user created: {} (windowsUsername=dklokov)", dkEmail);
        }
    }
}
