package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Inc 6: the hub apply path runs real LWW (flag sync.hub.apply-lww-enabled=true) instead of blindly
 * applying every already-saved change. Two things must both hold, and the FIRST is the one that makes
 * this the riskiest change in the plan:
 *
 * <ol>
 *   <li><b>Self-reject regression (the alarm).</b> On the hub, a change is compared against its OWN
 *       just-saved row (same global id). It MUST still apply. If the identity short-circuit is wrong,
 *       the hub silently applies NOTHING while still returning success and broadcasting — an invisible
 *       total outage. This test fails loudly if that ever regresses.</li>
 *   <li><b>Older loses.</b> A genuinely older change from a concurrent exchange must NOT overwrite the
 *       newer value already on the hub (the bug the flag fixes).</li>
 * </ol>
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:hub-apply-lww-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false",
        "sync.hub.apply-lww-enabled=true"   // the flag under test
})
@DisplayName("Hub apply LWW (Inc 6, flag on)")
class HubApplyLwwIT {

    @Autowired
    private FieldSyncService fieldSyncService;
    @Autowired
    private FieldChangeRepository fieldChangeRepository;
    @Autowired
    private PlatformTransactionManager txManager;
    @PersistenceContext
    private EntityManager entityManager;

    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private long givenCommittedLotoPoint(String tag, String description) {
        return new TransactionTemplate(txManager).execute(s -> {
            LotoPoint p = new LotoPoint();
            p.setTagNumber(tag);
            p.setDescription(description);
            entityManager.persist(p);
            entityManager.flush();
            return p.getId();
        });
    }

    private FieldChange descChange(long pointId, String value, Instant ts) {
        FieldChange c = new FieldChange("LotoPoint", pointId, "description", null, "\"" + value + "\"",
                "REMOTE", "remote-machine", FieldChange.ChangeType.UPDATE);
        c.setId(UUID.randomUUID());
        c.setTimestamp(ts);
        return c;
    }

    private String descriptionOf(long id) {
        return new TransactionTemplate(txManager).execute(s ->
                (String) entityManager.createQuery("SELECT p.description FROM LotoPoint p WHERE p.id = :id")
                        .setParameter("id", id).getSingleResult());
    }

    @Test
    @DisplayName("SELF-REJECT REGRESSION: the hub still applies a change whose own row is the latest")
    void selfRejectRegression_hubStillApplies() {
        long id = givenCommittedLotoPoint("HUB-LWW-SELF", "original");
        Instant ts = Instant.now().plusSeconds(3600).truncatedTo(ChronoUnit.MILLIS);

        // Simulate the real hub sequence: the FieldChange row is already saved (by
        // processIncomingChangesBatched), but the entity has NOT been updated yet — the detached apply
        // thread runs next. So the latest-map will contain this very change.
        FieldChange x = descChange(id, "hub-applied", ts);
        new TransactionTemplate(txManager).executeWithoutResult(s -> fieldChangeRepository.save(x));

        // Hub apply (skipSave=true). With LWW on, x is compared against its OWN saved row.
        fieldSyncService.applyIncomingChanges(List.of(x), true);

        assertThat(descriptionOf(id))
                .as("a change comparing against its own saved row must APPLY — else the hub silently "
                        + "applies nothing while reporting success")
                .isEqualTo("hub-applied");
    }

    @Test
    @DisplayName("OLDER LOSES: an older concurrent change does not overwrite the newer value on the hub")
    void olderConcurrentChange_doesNotOverwriteNewer() {
        long id = givenCommittedLotoPoint("HUB-LWW-OLDER", "original");
        Instant base = Instant.now().plusSeconds(3600).truncatedTo(ChronoUnit.MILLIS);

        // The hub already has the NEWER change applied (value "newer", timestamp base+50).
        FieldChange newer = descChange(id, "newer", base.plusMillis(50));
        new TransactionTemplate(txManager).executeWithoutResult(s -> fieldChangeRepository.save(newer));
        fieldSyncService.applyIncomingChanges(List.of(newer), true);
        assertThat(descriptionOf(id)).isEqualTo("newer");

        // A concurrent exchange now delivers an OLDER change for the same field.
        FieldChange older = descChange(id, "older", base);
        new TransactionTemplate(txManager).executeWithoutResult(s -> fieldChangeRepository.save(older));
        fieldSyncService.applyIncomingChanges(List.of(older), true);

        assertThat(descriptionOf(id))
                .as("the older change must lose to the newer value already on the hub")
                .isEqualTo("newer");
    }
}
