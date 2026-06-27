package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:user-fc-emission-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("User entity FieldChange emission")
@Transactional
@Rollback(false)
class UserFieldChangeEmissionIT {

    @Autowired private UserRepo userRepo;
    @Autowired private FieldChangeRepository fieldChangeRepository;
    @Autowired private EntityManager entityManager;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;

    @Test
    @DisplayName("User create and update through JPA emit FieldChange rows")
    void userCreateAndUpdate_emitFieldChanges() {
        User user = User.builder()
                .username("sync-user")
                .firstName("Sync")
                .lastName("User")
                .name("Sync User")
                .email("sync-user@example.test")
                .role("ROLE_PLANT")
                .password("not-a-real-hash")
                .isActive(true)
                .windowsUsername("syncuser")
                .build();

        user = userRepo.saveAndFlush(user);
        entityManager.flush();
        Long userId = user.getId();

        List<FieldChange> createChanges = fieldChangeRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("User", userId);
        assertThat(createChanges)
                .as("creating a User should emit a CREATE marker and initial field rows")
                .anyMatch(fc -> fc.getChangeType() == FieldChange.ChangeType.CREATE
                        && "_entity_".equals(fc.getFieldName()));

        long beforeUpdate = createChanges.stream()
                .filter(fc -> "title".equals(fc.getFieldName()))
                .count();

        User loaded = userRepo.findById(userId).orElseThrow();
        loaded.setTitle("Sync Test Title");
        userRepo.saveAndFlush(loaded);
        entityManager.flush();

        List<FieldChange> updateChanges = fieldChangeRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("User", userId);
        long afterUpdate = updateChanges.stream()
                .filter(fc -> "title".equals(fc.getFieldName()))
                .count();

        assertThat(afterUpdate)
                .as("updating a User scalar field should emit an UPDATE field row")
                .isGreaterThan(beforeUpdate);
    }
}
