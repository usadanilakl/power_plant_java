package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The post-cold-resync outbound-suppression mark ({@link FieldChangeRepository#markForeignChangesSyncedToServer}).
 *
 * <p>After a full-DB swap a client's restored DB IS the hub's snapshot; re-pushing all of it back to the hub is
 * wasteful and fires false "OUT OF SYNC" alarms. The mark stamps FOREIGN-origin rows synced-to-"SERVER" so the
 * outbound loop skips them. The safety-critical property under test: it must NEVER stamp a row this client could
 * still owe the hub — i.e. never an {@code origin = me} row (a rescued or concurrent local edit) and never a
 * null-origin row — regardless of any clock. Own-origin rows staying pending (re-pushed once, id-deduped) is the
 * intended safe over-approximation.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:mark-foreign-on-server-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("markForeignChangesSyncedToServer — post-swap outbound suppression")
class MarkForeignSnapshotOnServerIT {

    private static final String ME = "THIS-CLIENT";

    @Autowired
    private FieldChangeRepository fieldChangeRepository;
    @Autowired
    private PlatformTransactionManager txManager;

    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private TransactionTemplate tx() {
        return new TransactionTemplate(txManager);
    }

    /** Persist a FieldChange with a chosen origin; {@code tweak} can mutate it (e.g. add SERVER, null the origin). */
    private UUID save(String origin, long eid, Consumer<FieldChange> tweak) {
        UUID id = UUID.randomUUID();
        tx().executeWithoutResult(s -> {
            FieldChange c = new FieldChange("LotoPoint", eid, "description", null, "\"v\"",
                    origin, origin + "-name", FieldChange.ChangeType.UPDATE);
            c.setId(id);
            if (tweak != null) tweak.accept(c);
            fieldChangeRepository.save(c);
        });
        return id;
    }

    /** Run the @Modifying mark inside a transaction (in prod it runs via the @Transactional service method). */
    private int mark() {
        return tx().execute(s -> fieldChangeRepository.markForeignChangesSyncedToServer(ME));
    }

    private boolean syncedToServer(UUID id) {
        return tx().execute(s -> fieldChangeRepository.findById(id).orElseThrow().isSyncedTo("SERVER"));
    }

    private String syncedString(UUID id) {
        return tx().execute(s -> fieldChangeRepository.findById(id).orElseThrow().getSyncedToMachines());
    }

    @Test
    @DisplayName("stamps foreign-origin rows that aren't yet on the hub, and only those")
    void marksForeignNotYetOnServer() {
        // NOTE: origin_machine_id is NOT NULL in the schema, so a null-origin row can't exist — the `origin <> me`
        // predicate can never be defeated by a null. We therefore only need to prove: foreign gets marked, own
        // never does, and an already-marked foreign row is left alone. Assertions are per-row (by id): a booted
        // @SpringBootTest context seeds many FieldChanges, so global counts aren't stable.
        UUID foreign = save("PEER-A", 1, null);                                 // "|PEER-A|" — owed re-push before fix
        UUID own = save(ME, 2, null);                                           // "|THIS-CLIENT|" — could be unpushed
        UUID foreignAlready = save("PEER-C", 4, c -> c.addSyncedMachine("SERVER")); // "|PEER-C||SERVER|"

        mark();

        assertThat(syncedToServer(foreign)).as("foreign snapshot row is now already-on-hub → no re-push").isTrue();

        // The safety guarantee — never touch a row this client might still owe the hub.
        assertThat(syncedToServer(own)).as("origin=me MUST stay pending (rescued/concurrent local edits)").isFalse();

        // Idempotent: an already-marked foreign row is untouched (not double-stamped).
        assertThat(syncedString(foreignAlready)).as("no double |SERVER|").isEqualTo("|PEER-C||SERVER|");
    }

    @Test
    @DisplayName("is idempotent — a second run does not re-stamp an already-marked row")
    void secondRunDoesNotRestamp() {
        UUID a = save("IDEMPO-PEER", 10, null);
        UUID b = save("IDEMPO-PEER", 11, null);

        mark();
        assertThat(syncedToServer(a)).isTrue();
        assertThat(syncedToServer(b)).isTrue();

        String afterFirst = syncedString(a);
        mark();
        assertThat(syncedString(a)).as("a second run leaves an already-on-hub row byte-for-byte unchanged")
                .isEqualTo(afterFirst);
    }
}
