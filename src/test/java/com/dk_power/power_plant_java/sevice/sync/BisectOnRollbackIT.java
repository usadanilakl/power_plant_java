package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Bisect-on-rollback (Inc 2 follow-up): a single poison change in a batch must NOT charge its innocent
 * batch-mates. Before the fix, one constraint violation rolls the whole batch back and every change is
 * marked FAILED_RETRYABLE — so the healthy changes are re-pulled 15× then dead-lettered. With the flag,
 * the batch is bisected on rollback: the poison is isolated to a size-1 sub-batch and it alone stays
 * FAILED_RETRYABLE, while the healthy changes apply and are acked.
 *
 * <p>The poison is a real DB unique-constraint violation (Instrument.tagNumber is {@code unique=true},
 * and the test DB keeps unique constraints — only NOT NULL is relaxed by SyncSchemaPreparation).
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:bisect-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Bisect-on-rollback isolates a poison change from its batch-mates")
class BisectOnRollbackIT {

    @Autowired private FieldSyncService fieldSyncService;
    @Autowired private PlatformTransactionManager txManager;
    @PersistenceContext private EntityManager entityManager;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private void setFlag(boolean on) {
        ReflectionTestUtils.setField(fieldSyncService, "bisectOnRollbackEnabled", on);
    }

    private long givenLotoPoint(String tag) {
        return new TransactionTemplate(txManager).execute(s -> {
            LotoPoint p = new LotoPoint();
            p.setTagNumber(tag);
            p.setDescription("original");
            entityManager.persist(p);
            entityManager.flush();
            return p.getId();
        });
    }

    private long givenInstrument(String tag) {
        return new TransactionTemplate(txManager).execute(s -> {
            Instrument i = new Instrument();
            i.setTagNumber(tag);
            entityManager.persist(i);
            entityManager.flush();
            return i.getId();
        });
    }

    private static FieldChange update(String type, long id, String field, String jsonValue) {
        FieldChange c = new FieldChange(type, id, field, null, jsonValue, "REMOTE", "remote",
                FieldChange.ChangeType.UPDATE);
        c.setId(UUID.randomUUID());
        c.setTimestamp(Instant.now().plusSeconds(3600));
        return c;
    }

    private String lotoDescription(long id) {
        return new TransactionTemplate(txManager).execute(s ->
                (String) entityManager.createQuery("SELECT p.description FROM LotoPoint p WHERE p.id = :id")
                        .setParameter("id", id).getSingleResult());
    }

    private String instrumentTag(long id) {
        return new TransactionTemplate(txManager).execute(s ->
                (String) entityManager.createQuery("SELECT i.tagNumber FROM Instrument i WHERE i.id = :id")
                        .setParameter("id", id).getSingleResult());
    }

    @Test
    @DisplayName("flag OFF (current behaviour): a poison charges its healthy batch-mates FAILED_RETRYABLE")
    void wholeBatch_chargesInnocentNeighbours() {
        setFlag(false);
        long p1 = givenLotoPoint("BIS-OFF-P1");
        givenInstrument("BIS-OFF-A");             // holds tag BIS-OFF-A
        long instrB = givenInstrument("BIS-OFF-B");

        FieldChange healthy = update("LotoPoint", p1, "description", "\"healed\"");
        FieldChange poison = update("Instrument", instrB, "tagNumber", "\"BIS-OFF-A\""); // duplicate → unique violation

        DispositionLedger ledger = fieldSyncService.applyIncomingChangesForTest(List.of(healthy, poison), false, null);

        assertThat(ledger.of(healthy))
                .as("the innocent neighbour is charged because the whole batch rolled back — the bug")
                .isEqualTo(ChangeDisposition.FAILED_RETRYABLE);
        assertThat(lotoDescription(p1)).as("and it did not apply").isEqualTo("original");
    }

    @Test
    @DisplayName("flag ON (the fix): the poison alone is FAILED_RETRYABLE; healthy neighbours apply")
    void bisect_isolatesPoison() {
        setFlag(true);
        long p1 = givenLotoPoint("BIS-ON-P1");
        long p2 = givenLotoPoint("BIS-ON-P2");
        givenInstrument("BIS-ON-A");
        long instrB = givenInstrument("BIS-ON-B");

        FieldChange healthy1 = update("LotoPoint", p1, "description", "\"healed-1\"");
        FieldChange poison = update("Instrument", instrB, "tagNumber", "\"BIS-ON-A\""); // duplicate → unique violation
        FieldChange healthy2 = update("LotoPoint", p2, "description", "\"healed-2\"");

        DispositionLedger ledger = fieldSyncService.applyIncomingChangesForTest(
                List.of(healthy1, poison, healthy2), false, null);

        assertThat(ledger.of(poison))
                .as("the genuine poison is isolated and stays retryable")
                .isEqualTo(ChangeDisposition.FAILED_RETRYABLE);
        assertThat(ledger.of(healthy1)).as("healthy neighbour 1 applied, not charged").isEqualTo(ChangeDisposition.APPLIED);
        assertThat(ledger.of(healthy2)).as("healthy neighbour 2 applied, not charged").isEqualTo(ChangeDisposition.APPLIED);
        assertThat(lotoDescription(p1)).isEqualTo("healed-1");
        assertThat(lotoDescription(p2)).isEqualTo("healed-2");
        assertThat(instrumentTag(instrB)).as("the poison did not apply — tag unchanged").isEqualTo("BIS-ON-B");
    }
}
