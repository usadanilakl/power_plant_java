package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.HubChangeApplyState;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.HubChangeApplyStateRepo;
import com.dk_power.power_plant_java.sevice.hub.HubApplyStateRecovery;
import com.dk_power.power_plant_java.sevice.hub.HubApplyStateSinkImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end durable hub apply-state (Inc 7 — the D7 fix), exercised with the real apply path.
 *
 * <p>The sink and recovery beans are {@code @ConditionalOnProperty(sync.role=hub)} and so are absent in a
 * normal test context; rather than boot the whole hub profile, they are constructed here against the real
 * repositories and injected (the flag defaults to OFF everywhere, so this is the only way to exercise the
 * ON path). {@link FieldSyncService} runs on both hub and client, so its optional sink field is set here.
 *
 * <p>Headline test: {@link #restartDurability_rescanAppliesWhatWasNeverApplied} is the D7 fix — a change
 * saved with a PENDING apply-state row but never applied (hub crashed between save and apply) is applied
 * by a rescan that, in production, runs on startup. Before Inc 7 the only recovery was an in-memory queue
 * a restart wiped, so the change stayed permanently unapplied on the hub.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:hub-durable-apply-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false",
        "sync.hub.apply-lww-enabled=true"
})
@DisplayName("Hub durable apply-state (Inc 7)")
class HubDurableApplyStateIT {

    @Autowired
    private FieldSyncService fieldSyncService;
    @Autowired
    private HubChangeApplyStateRepo applyStateRepo;
    @Autowired
    private FieldChangeRepository fieldChangeRepository;
    @Autowired
    private SyncDeadLetterService syncDeadLetterService;
    @Autowired
    private SyncConfig syncConfig;
    @Autowired
    private PlatformTransactionManager txManager;
    @PersistenceContext
    private EntityManager entityManager;

    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private HubApplyStateSinkImpl sink;
    private HubApplyStateRecovery recovery;

    @BeforeEach
    void wireDurablePath() {
        sink = new HubApplyStateSinkImpl(applyStateRepo, txManager);
        ReflectionTestUtils.setField(sink, "durableApplyStateEnabled", true);
        // FieldSyncService.applyIncomingChangesTracked calls this optional field for co-commit B.
        ReflectionTestUtils.setField(fieldSyncService, "hubApplyStateSink", sink);

        recovery = new HubApplyStateRecovery(applyStateRepo, fieldChangeRepository, fieldSyncService,
                sink, syncDeadLetterService, syncConfig, txManager);
        ReflectionTestUtils.setField(recovery, "durableEnabled", true);
        ReflectionTestUtils.setField(recovery, "maxAttempts", 15);
        ReflectionTestUtils.setField(recovery, "deferredMaxAgeMinutes", 1440L);
        ReflectionTestUtils.setField(recovery, "rescanPageSize", 200);
        ReflectionTestUtils.setField(recovery, "reconcileWindowHours", 24L);
        ReflectionTestUtils.setField(recovery, "applyStateRetentionDays", 7L);
    }

    @AfterEach
    void unwire() {
        ReflectionTestUtils.setField(fieldSyncService, "hubApplyStateSink", null);
    }

    private TransactionTemplate tx() {
        return new TransactionTemplate(txManager);
    }

    private long givenCommittedLotoPoint(String tag, String description) {
        return tx().execute(s -> {
            LotoPoint p = new LotoPoint();
            p.setTagNumber(tag);
            p.setDescription(description);
            entityManager.persist(p);
            entityManager.flush();
            return p.getId();
        });
    }

    private FieldChange updateChange(long pointId, String newValue) {
        FieldChange c = new FieldChange("LotoPoint", pointId, "description", null, "\"" + newValue + "\"",
                "REMOTE-MACHINE", "remote-machine", FieldChange.ChangeType.UPDATE);
        c.setId(UUID.randomUUID());
        // Future timestamp so it unambiguously wins LWW over the fixture's own CREATE emissions.
        c.setTimestamp(Instant.now().plusSeconds(3600).truncatedTo(ChronoUnit.MILLIS));
        return c;
    }

    private String descriptionOf(long id) {
        return tx().execute(s -> (String) entityManager
                .createQuery("SELECT p.description FROM LotoPoint p WHERE p.id = :id")
                .setParameter("id", id).getSingleResult());
    }

    private String dispositionOf(UUID changeId) {
        return tx().execute(s -> applyStateRepo.findById(changeId).map(HubChangeApplyState::getDisposition).orElse(null));
    }

    @Test
    @DisplayName("co-commit A writes PENDING; co-commit B flips it to APPLIED as the entity is applied")
    void coCommitA_thenB_pendingBecomesApplied() {
        long pointId = givenCommittedLotoPoint("HCAS-AB", "before");
        FieldChange change = updateChange(pointId, "after");

        // Co-commit A: the hub saved the change and, in the same tx, a PENDING apply-state row.
        tx().executeWithoutResult(s -> sink.ensurePending(List.of(change)));
        assertThat(dispositionOf(change.getId())).isEqualTo(HubChangeApplyState.PENDING);

        // Apply (skipSave=true, the hub already saved the FieldChange). Co-commit B runs INSIDE the apply tx.
        fieldSyncService.applyIncomingChangesTracked(List.of(change), true);

        assertThat(descriptionOf(pointId)).isEqualTo("after");
        assertThat(dispositionOf(change.getId()))
                .as("the apply and its APPLIED disposition co-commit").isEqualTo("APPLIED");
    }

    @Test
    @DisplayName("RESTART DURABILITY: a rescan applies a change that was saved+PENDING but never applied")
    void restartDurability_rescanAppliesWhatWasNeverApplied() {
        long pointId = givenCommittedLotoPoint("HCAS-RESTART", "original");
        FieldChange change = updateChange(pointId, "recovered");

        // Simulate the hub having saved the change + a PENDING row, then crashing BEFORE applying it.
        tx().executeWithoutResult(s -> {
            fieldChangeRepository.save(change);
            sink.ensurePending(List.of(change));
        });
        assertThat(descriptionOf(pointId)).as("not applied yet").isEqualTo("original");
        assertThat(dispositionOf(change.getId())).isEqualTo(HubChangeApplyState.PENDING);

        // The restart-time rescan (runs on ApplicationReadyEvent in prod) re-applies from the durable row.
        recovery.runRescan();

        assertThat(descriptionOf(pointId))
                .as("the durable PENDING row survived the 'restart'; the rescan applied it — the D7 fix")
                .isEqualTo("recovered");
        assertThat(dispositionOf(change.getId())).isEqualTo("APPLIED");
    }

    @Test
    @DisplayName("co-commit B never marks a non-applied change APPLIED — a deferred change stays retryable")
    void coCommitB_deferredChangeStaysNonTerminal() {
        // An UPDATE for an entity that does not exist and has no CREATE — genuinely DEFERRED.
        FieldChange orphan = updateChange(999_000_777L, "orphan");
        tx().executeWithoutResult(s -> sink.ensurePending(List.of(orphan)));

        DispositionLedger ledger = fieldSyncService.applyIncomingChangesTracked(List.of(orphan), true);
        // In production the Phase-4 vthread / rescan calls this after the tracked apply returns.
        sink.bumpRetryable(ledger.idDispositions());

        assertThat(ledger.of(orphan)).isEqualTo(ChangeDisposition.DEFERRED);
        assertThat(dispositionOf(orphan.getId()))
                .as("co-commit B persists ONLY terminals; a deferred change must not read APPLIED")
                .isEqualTo("DEFERRED");
    }

    @Test
    @DisplayName("ledger totality: a representative batch leaves NO input change unclassified (gap counter stays 0)")
    void ledgerTotality_noGaps() {
        long pointId = givenCommittedLotoPoint("HCAS-TOTALITY", "v0");
        FieldChange update = updateChange(pointId, "v1");

        long before = fieldSyncService.getLedgerTotalityGapCount();
        DispositionLedger ledger = fieldSyncService.applyIncomingChangesTracked(List.of(update), true);
        long after = fieldSyncService.getLedgerTotalityGapCount();

        assertThat(ledger.of(update)).as("every input change classified").isNotNull();
        assertThat(after - before)
                .as("no input change ended the run without a disposition (would leave a PENDING row stuck)")
                .isZero();
    }
}
