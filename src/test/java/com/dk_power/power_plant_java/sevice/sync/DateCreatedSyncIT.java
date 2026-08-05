package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * dateCreated must be synced (Inc 10 / D4): it is the entity's immutable creation instant, so the SAME
 * entity must show the SAME dateCreated on every node. Previously dateCreated was on the sync exclusion
 * list AND re-minted by {@code BaseIdEntity.onCreate()} at apply, so a synced create got the RECEIVER's
 * local time — the same entity had a different creation timestamp per machine (and, since permit-number
 * buckets derive from it, a user-visible "different permit number" divergence).
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:datecreated-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("dateCreated converges across nodes")
class DateCreatedSyncIT {

    @Autowired private FieldSyncService fieldSyncService;
    @Autowired private LotoPointRepo lotoPointRepo;
    @Autowired private FieldChangeRepository fieldChangeRepository;
    @Autowired private PlatformTransactionManager txManager;
    @PersistenceContext private EntityManager entityManager;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    @Test
    @DisplayName("a create emits dateCreated, and applying it on another node preserves the origin's creation time")
    void dateCreatedConvergesAcrossNodes() {
        LocalDateTime origin = LocalDateTime.of(2020, 1, 1, 8, 30);

        // Create locally — @PostPersist emits the CREATE FieldChanges. dateCreated is set explicitly and
        // preserved by onCreate()'s null-guard, so the emitted value is the origin's creation instant.
        long originId = new TransactionTemplate(txManager).execute(s -> {
            LotoPoint p = new LotoPoint();
            p.setTagNumber("DC-SYNC");
            p.setDateCreated(origin);
            return lotoPointRepo.saveAndFlush(p).getId();
        });

        List<FieldChange> emitted =
                fieldChangeRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("LotoPoint", originId);
        assertThat(emitted)
                .as("a create must EMIT dateCreated, or receivers can never learn the origin's creation time")
                .anyMatch(c -> "dateCreated".equals(c.getFieldName()));

        // Rebind those changes to a NEW id and apply as if received on another node.
        long receiverId = 9_000_777_333L;
        List<FieldChange> received = emitted.stream().map(c -> rebind(c, receiverId)).collect(Collectors.toList());
        fieldSyncService.applyIncomingChanges(received, false, null);

        LocalDateTime onReceiver = new TransactionTemplate(txManager).execute(s ->
                (LocalDateTime) entityManager.createQuery(
                                "SELECT p.dateCreated FROM LotoPoint p WHERE p.id = :id")
                        .setParameter("id", receiverId).getSingleResult());
        assertThat(onReceiver)
                .as("the same entity must have the SAME creation time on every node — not re-minted locally")
                .isEqualTo(origin);
    }

    private FieldChange rebind(FieldChange src, long newId) {
        FieldChange c = new FieldChange(src.getEntityType(), newId, src.getFieldName(),
                src.getOldValue(), src.getNewValue(), src.getOriginMachineId(), src.getOriginMachineName(),
                src.getChangeType());
        c.setId(UUID.randomUUID());
        c.setRelationshipType(src.getRelationshipType());
        c.setTimestamp(src.getTimestamp());
        return c;
    }
}
