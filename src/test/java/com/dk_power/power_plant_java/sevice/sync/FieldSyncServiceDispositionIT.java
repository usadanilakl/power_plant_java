package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.SyncDeadLetterRepo;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the apply path's per-change outcomes are recorded — the prerequisite for acknowledgement that
 * only acks what was genuinely resolved.
 *
 * <p>Every assertion here is RED on the pre-ledger code, and each for a different reason worth naming:
 * the entity-not-found branch returns 0 under a log that literally says "deferring" (it doesn't defer);
 * the unknown-field branch is a bare {@code log.warn} that discards a real change with no record
 * anywhere; and the incomplete-ManyToMany branch returns false under a comment promising "retry can
 * apply atomically" — a retry the ack path currently prevents by acking the change.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:fieldsync-disposition-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("FieldSyncService per-change dispositions")
class FieldSyncServiceDispositionIT {

    @Autowired
    private FieldSyncService fieldSyncService;
    @Autowired
    private SyncDeadLetterRepo syncDeadLetterRepo;
    @Autowired
    private PlatformTransactionManager txManager;
    @PersistenceContext
    private EntityManager entityManager;

    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private static FieldChange change(String entityType, Long entityId, String field, String newValue,
                                      FieldChange.ChangeType type) {
        FieldChange c = new FieldChange(entityType, entityId, field, null, newValue,
                "REMOTE-MACHINE", "remote-machine", type);
        c.setId(UUID.randomUUID());
        c.setTimestamp(Instant.now());
        return c;
    }

    /** Persist a LotoPoint in its own committed tx so the apply path sees it as pre-existing. */
    private long givenCommittedLotoPoint(String tag) {
        return new TransactionTemplate(txManager).execute(s -> {
            LotoPoint p = new LotoPoint();
            p.setTagNumber(tag);
            p.setDescription("disposition IT point");
            entityManager.persist(p);
            entityManager.flush();
            return p.getId();
        });
    }

    @Test
    @DisplayName("scalar change for an entity that doesn't exist (no CREATE) is DEFERRED, not silently dropped")
    void entityNotFound_isDeferred() {
        FieldChange orphan = change("LotoPoint", 999_000_111L, "description", "\"orphan\"",
                FieldChange.ChangeType.UPDATE);

        DispositionLedger ledger = fieldSyncService.applyIncomingChangesForTest(List.of(orphan), false, null);

        assertThat(ledger.of(orphan))
                .as("the parent hasn't arrived yet — retryable. Today this is `return 0` under a log that says 'deferring'")
                .isEqualTo(ChangeDisposition.DEFERRED);
    }

    @Test
    @DisplayName("change for a field the schema doesn't have is DEAD_LETTER and is actually recorded")
    void unknownField_isDeadLetteredAndRecorded() {
        long pointId = givenCommittedLotoPoint("DISP-IT-UNKNOWN-FIELD");
        long before = syncDeadLetterRepo.count();

        FieldChange bogus = change("LotoPoint", pointId, "fieldThatDoesNotExist_xyz", "\"v\"",
                FieldChange.ChangeType.UPDATE);

        DispositionLedger ledger = fieldSyncService.applyIncomingChangesForTest(List.of(bogus), false, null);

        assertThat(ledger.of(bogus))
                .as("a field this schema lacks can never apply — permanent, not pending")
                .isEqualTo(ChangeDisposition.DEAD_LETTER);
        assertThat(syncDeadLetterRepo.count())
                .as("previously a bare log.warn: the change was discarded with no record anywhere")
                .isGreaterThan(before);
    }

    @Test
    @DisplayName("incomplete ManyToMany (referenced entities absent) is DEFERRED so it can be re-pulled")
    void manyToManyIncomplete_isDeferred() {
        long pointId = givenCommittedLotoPoint("DISP-IT-M2M-OWNER");

        // Equipment.lotoPoints is the owning ManyToMany side (@JoinTable eq_loto_point). Point at a
        // LotoPoint id that does not exist locally — the classic split-batch case.
        FieldChange m2m = change("Equipment", 999_000_222L, "lotoPoints",
                "[" + pointId + ",999000333]", FieldChange.ChangeType.UPDATE);
        m2m.setRelationshipType("ManyToMany");

        DispositionLedger ledger = fieldSyncService.applyIncomingChangesForTest(List.of(m2m), false, null);

        assertThat(ledger.of(m2m))
                .as("must be re-pullable: applying a partial join table would silently drop the missing links")
                .isIn(ChangeDisposition.DEFERRED, ChangeDisposition.FAILED_RETRYABLE);
        assertThat(ledger.of(m2m))
                .as("whatever it is, it must NOT be a terminal/ackable outcome")
                .isNotIn(ChangeDisposition.APPLIED, ChangeDisposition.NOOP_SUPERSEDED, ChangeDisposition.DEAD_LETTER);
    }

    @Test
    @DisplayName("EQUIVALENCE GATE: the returned applied-count is unchanged by the observer refactor")
    void equivalenceGate_appliedCountUnchanged() {
        long existing = givenCommittedLotoPoint("DISP-IT-EQUIV");

        // A batch spanning the outcomes that matter: a real scalar update on an existing entity,
        // an orphan (deferred), an unknown field (dead-letter), and an incomplete M2M.
        FieldChange realUpdate = change("LotoPoint", existing, "description", "\"updated by sync\"",
                FieldChange.ChangeType.UPDATE);
        FieldChange orphan = change("LotoPoint", 999_000_444L, "description", "\"orphan\"",
                FieldChange.ChangeType.UPDATE);
        FieldChange bogusField = change("LotoPoint", existing, "nopeNotAField", "\"v\"",
                FieldChange.ChangeType.UPDATE);

        int applied = fieldSyncService.applyIncomingChanges(
                List.of(realUpdate, orphan, bogusField), false, null);

        // Pre-refactor value, captured by running this same batch with the note() calls removed.
        // The ledger must OBSERVE only: if this number moves, the refactor changed behaviour and the
        // increment is not safe to build acknowledgement on top of.
        assertThat(applied)
                .as("applied-count must be byte-identical to pre-refactor (1: only the real scalar update lands)")
                .isEqualTo(1);
    }
}
