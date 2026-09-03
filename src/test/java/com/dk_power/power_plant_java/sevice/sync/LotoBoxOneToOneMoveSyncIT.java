package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression for the production hub loop (2026-09-02): applying an incoming {@code LotoBox.loto} change
 * looped FOREVER on "Unique index or primary key violation ... LOTO_BOXES(LOTO)". {@code LotoBox.loto} is
 * {@code @OneToOne}, so the FK column is UNIQUE — one Loto is held by at most one box. A Red-Tag change-box
 * MOVES a Loto from box A to box B, emitting both {@code A.loto=null} and {@code B.loto=Loto}. On the
 * receiver, {@code B.loto=Loto} can apply while box A still holds it, so Hibernate would flush two rows with
 * the same unique FK → constraint violation → the batch rolls back, bisects, and re-pulls the change
 * forever (the violation is deemed retryable, but the conflicting holder never releases on its own).
 *
 * <p>The fix: {@code FieldSyncService}'s new OneToOne apply branch releases any prior holder of the
 * referenced Loto before claiming it, so the move converges. RED before the fix (the change stays
 * {@code FAILED_RETRYABLE} and box B never gets the Loto), GREEN after ({@code APPLIED}, box A released,
 * box B holds it). A no-conflict control proves the ordinary set path still works.
 *
 * <p>The test DB keeps unique constraints (only NOT NULL is relaxed by SyncSchemaPreparation), so the
 * {@code loto_boxes(loto)} unique index is present exactly as on the hub — see {@link BisectOnRollbackIT}.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:loto-o2o-move-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("LotoBox @OneToOne move: releasing the prior holder makes a box-move converge (prod 2026-09-02)")
class LotoBoxOneToOneMoveSyncIT {

    @Autowired private FieldSyncService fieldSyncService;
    @Autowired private PlatformTransactionManager txManager;
    @PersistenceContext private EntityManager entityManager;

    // Boot-only mocks: RedTag needs SikuliX; the GitHub publisher would hit the network on save.
    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private long givenLoto() {
        return new TransactionTemplate(txManager).execute(s -> {
            Loto l = new Loto();
            entityManager.persist(l);
            entityManager.flush();
            return l.getId();
        });
    }

    private long givenBox(Long lotoId) {
        return new TransactionTemplate(txManager).execute(s -> {
            LotoBox b = new LotoBox();
            if (lotoId != null) b.setLoto(entityManager.getReference(Loto.class, lotoId));
            entityManager.persist(b);
            entityManager.flush();
            return b.getId();
        });
    }

    private Long boxLoto(long boxId) {
        return new TransactionTemplate(txManager).execute(s -> {
            // Note: the row exists but its loto column may be NULL — Stream.findFirst() rejects a null
            // element, so read the list positionally instead.
            List<?> rows = entityManager.createNativeQuery("SELECT loto FROM loto_boxes WHERE id = " + boxId)
                    .getResultList();
            Object r = rows.isEmpty() ? null : rows.get(0);
            return r == null ? null : ((Number) r).longValue();
        });
    }

    private static FieldChange oneToOneSet(long boxId, long lotoId) {
        FieldChange c = new FieldChange("LotoBox", boxId, "loto", null, String.valueOf(lotoId),
                "REMOTE", "remote", FieldChange.ChangeType.UPDATE);
        c.setId(UUID.randomUUID());
        c.setRelationshipType("OneToOne");
        c.setTimestamp(Instant.now().plusSeconds(3600));
        return c;
    }

    @Test
    @DisplayName("a box-move whose prior box still holds the Loto converges (was an infinite unique-violation loop)")
    void boxMove_releasesPriorHolder_andConverges() {
        long loto = givenLoto();
        long boxA = givenBox(loto);   // prior owner, holds the Loto (the hub's stuck state)
        long boxB = givenBox(null);   // new owner, empty — the move's target

        assertThat(boxLoto(boxA)).as("seed: box A holds the Loto").isEqualTo(loto);
        assertThat(boxLoto(boxB)).as("seed: box B is empty").isNull();

        // Incoming: the move's set-half — box B claims the Loto while box A still holds it on this node.
        FieldChange move = oneToOneSet(boxB, loto);
        DispositionLedger ledger = fieldSyncService.applyIncomingChangesForTest(List.of(move), false, null);

        assertThat(ledger.of(move))
                .as("the move applies instead of looping forever on the unique violation")
                .isEqualTo(ChangeDisposition.APPLIED);
        assertThat(boxLoto(boxB)).as("box B now holds the Loto").isEqualTo(loto);
        assertThat(boxLoto(boxA)).as("box A was released so the unique FK is free").isNull();
    }

    @Test
    @DisplayName("control: setting a Loto on a box when no other box holds it applies normally")
    void noConflict_setsNormally() {
        long loto = givenLoto();
        long box = givenBox(null);

        FieldChange set = oneToOneSet(box, loto);
        DispositionLedger ledger = fieldSyncService.applyIncomingChangesForTest(List.of(set), false, null);

        assertThat(ledger.of(set)).as("no conflict → applies normally").isEqualTo(ChangeDisposition.APPLIED);
        assertThat(boxLoto(box)).as("box holds the Loto").isEqualTo(loto);
    }
}
