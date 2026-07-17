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
        // Stamp clearly in the future, NOT Instant.now(). Persisting the fixture entity emits its own
        // CREATE FieldChanges microseconds earlier; on a same-microsecond collision LWW falls through to
        // the lexical origin-id tiebreaker ("REMOTE-MACHINE" vs the local machine id) and REJECTS the
        // change, so the test flips to applied=0 at random. These tests are about dispositions, not LWW —
        // make "this change is newer than anything local" unambiguous.
        c.setTimestamp(Instant.now().plusSeconds(3600));
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

    // ── Acknowledgement: a change may only be acked if it was genuinely resolved ──────────────
    // These assert the deferredOut contract the receiver uses to decide what to acknowledge.
    // Before this, deferredOut was populated by only three hand-picked call sites, so an incomplete
    // ManyToMany or a missing parent was acked — the sender marked it delivered and never re-sent it.

    @Test
    @DisplayName("an incomplete ManyToMany is NOT acknowledged, so the sender re-sends it")
    void incompleteManyToMany_isNotAcknowledged() {
        long pointId = givenCommittedLotoPoint("ACK-IT-M2M");
        FieldChange m2m = change("Equipment", 999_000_555L, "lotoPoints",
                "[" + pointId + ",999000556]", FieldChange.ChangeType.UPDATE);
        m2m.setRelationshipType("ManyToMany");

        java.util.Set<UUID> deferred = new java.util.HashSet<>();
        fieldSyncService.applyIncomingChanges(List.of(m2m), false, deferred);

        assertThat(deferred)
                .as("acking this would leave the join table permanently incomplete — the exact way a "
                        + "LotoStandard loses points the client hadn't received yet")
                .contains(m2m.getId());
    }

    @Test
    @DisplayName("a change whose parent hasn't arrived is NOT acknowledged")
    void entityNotFound_isNotAcknowledged() {
        FieldChange orphan = change("LotoPoint", 999_000_666L, "description", "\"orphan\"",
                FieldChange.ChangeType.UPDATE);

        java.util.Set<UUID> deferred = new java.util.HashSet<>();
        fieldSyncService.applyIncomingChanges(List.of(orphan), false, deferred);

        assertThat(deferred)
                .as("the parent may still arrive — acking now means it never gets another chance")
                .contains(orphan.getId());
    }

    @Test
    @DisplayName("a change that DID apply IS acknowledged (guards against over-deferring)")
    void appliedChange_isAcknowledged() {
        long pointId = givenCommittedLotoPoint("ACK-IT-APPLIED");
        FieldChange real = change("LotoPoint", pointId, "description", "\"applied by sync\"",
                FieldChange.ChangeType.UPDATE);

        java.util.Set<UUID> deferred = new java.util.HashSet<>();
        int applied = fieldSyncService.applyIncomingChanges(List.of(real), false, deferred);

        assertThat(applied).isEqualTo(1);
        assertThat(deferred)
                .as("a resolved change must be acked — deferring it would re-pull it forever and "
                        + "eventually burn the give-up budget on healthy data")
                .doesNotContain(real.getId());
    }

    @Test
    @DisplayName("IN-BATCH LWW: two changes to one field in ONE out-of-order batch resolve to the NEWEST, not list order")
    void sameFieldTwiceInBatch_newestWinsRegardlessOfOrder() {
        long id = givenCommittedLotoPoint("INBATCH-LWW");
        Instant base = Instant.now().plusSeconds(3600).truncatedTo(java.time.temporal.ChronoUnit.MILLIS);

        FieldChange older = new FieldChange("LotoPoint", id, "description", null, "\"older\"",
                "MACHINE-A", "MACHINE-A", FieldChange.ChangeType.UPDATE);
        older.setId(UUID.randomUUID());
        older.setTimestamp(base);
        FieldChange newer = new FieldChange("LotoPoint", id, "description", null, "\"newer\"",
                "MACHINE-A", "MACHINE-A", FieldChange.ChangeType.UPDATE);
        newer.setId(UUID.randomUUID());
        newer.setTimestamp(base.plusMillis(50));

        // Deliver NEWEST FIRST in one batch (the out-of-timestamp-order case, e.g. SSE fast-path).
        // Pre-fix: newer applied, then older applied against the stale DB snapshot -> "older" wins.
        fieldSyncService.applyIncomingChanges(List.of(newer, older), false, null);

        assertThat(currentDescription(id))
                .as("the newest value must win even when the batch is not timestamp-ordered")
                .isEqualTo("newer");
    }

    @Test
    @DisplayName("IN-BATCH LWW on CREATE: a new entity created from an out-of-order batch takes the NEWEST field value")
    void createFromBatch_sameFieldTwice_newestWins() {
        long newId = 1_000_055_123L; // an id not present locally -> the CREATE branch runs
        Instant base = Instant.now().plusSeconds(3600).truncatedTo(java.time.temporal.ChronoUnit.MILLIS);

        FieldChange createMarker = new FieldChange("LotoPoint", newId, "_entity_", null, "CREATED",
                "MACHINE-A", "MACHINE-A", FieldChange.ChangeType.CREATE);
        createMarker.setId(UUID.randomUUID());
        createMarker.setTimestamp(base);
        FieldChange tag = new FieldChange("LotoPoint", newId, "tagNumber", null, "\"CREATE-INBATCH\"",
                "MACHINE-A", "MACHINE-A", FieldChange.ChangeType.CREATE);
        tag.setId(UUID.randomUUID());
        tag.setTimestamp(base);
        FieldChange descOlder = new FieldChange("LotoPoint", newId, "description", null, "\"older\"",
                "MACHINE-A", "MACHINE-A", FieldChange.ChangeType.CREATE);
        descOlder.setId(UUID.randomUUID());
        descOlder.setTimestamp(base);
        FieldChange descNewer = new FieldChange("LotoPoint", newId, "description", null, "\"newer\"",
                "MACHINE-A", "MACHINE-A", FieldChange.ChangeType.UPDATE);
        descNewer.setId(UUID.randomUUID());
        descNewer.setTimestamp(base.plusMillis(50));

        // Deliver NEWEST-first (out of timestamp order) in one create batch.
        fieldSyncService.applyIncomingChanges(
                List.of(createMarker, tag, descNewer, descOlder), false, null);

        assertThat(currentDescription(newId))
                .as("a create batch out of timestamp order must still land the newest field value")
                .isEqualTo("newer");
    }

    @Test
    @DisplayName("CONVERGENCE: two conflicting equal-timestamp changes resolve to the SAME winner in either order")
    void equalTimestampConflict_convergesRegardlessOfOrder() {
        // Two machines edit the same field at the SAME instant. Which one wins must NOT depend on the
        // order they happen to be applied — that dependence is the coin-flip bug. The total order breaks
        // the tie by origin machine id (MACHINE-Z > MACHINE-A), so MACHINE-Z's value wins both ways.
        long id1 = givenCommittedLotoPoint("CONVERGE-1");
        long id2 = givenCommittedLotoPoint("CONVERGE-2");
        // Truncate to millis so the value is byte-identical after a DB round-trip — otherwise the stored
        // "first" change (read back from H2) and the in-memory "second" change differ by sub-milli
        // precision and it stops being a genuine tie, which is a test artifact, not the behaviour we test.
        Instant tie = Instant.now().plusSeconds(3600).truncatedTo(java.time.temporal.ChronoUnit.MILLIS);

        // id1: apply A then Z. id2: apply Z then A. Same conflict, opposite order.
        applyConflictPair(id1, tie, "MACHINE-A", "\"from-A\"", "MACHINE-Z", "\"from-Z\"");
        applyConflictPair(id2, tie, "MACHINE-Z", "\"from-Z\"", "MACHINE-A", "\"from-A\"");

        String winner1 = currentDescription(id1);
        String winner2 = currentDescription(id2);
        assertThat(winner1)
                .as("MACHINE-Z outranks MACHINE-A on a tie, so its value must win regardless of apply order")
                .contains("from-Z");
        assertThat(winner1)
                .as("both nodes must reach the identical state from the identical conflict")
                .isEqualTo(winner2);
    }

    private void applyConflictPair(long entityId, Instant sameTs,
                                   String origin1, String val1, String origin2, String val2) {
        FieldChange first = new FieldChange("LotoPoint", entityId, "description", null, val1,
                origin1, origin1, FieldChange.ChangeType.UPDATE);
        first.setId(UUID.randomUUID());
        first.setTimestamp(sameTs);
        FieldChange second = new FieldChange("LotoPoint", entityId, "description", null, val2,
                origin2, origin2, FieldChange.ChangeType.UPDATE);
        second.setId(UUID.randomUUID());
        second.setTimestamp(sameTs);
        fieldSyncService.applyIncomingChanges(List.of(first), false, null);
        fieldSyncService.applyIncomingChanges(List.of(second), false, null);
    }

    private String currentDescription(long id) {
        return new TransactionTemplate(txManager).execute(s ->
                (String) entityManager.createQuery(
                                "SELECT p.description FROM LotoPoint p WHERE p.id = :id")
                        .setParameter("id", id).getSingleResult());
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
