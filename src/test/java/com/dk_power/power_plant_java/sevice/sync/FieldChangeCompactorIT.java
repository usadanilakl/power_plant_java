package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.sync.HubChangeApplyState;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.HubChangeApplyStateRepo;
import com.dk_power.power_plant_java.sevice.hub.FieldChangeCompactor;
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
import java.util.Collection;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Log compaction (retention fix) — the safety-critical behavior: keep exactly the latest change per
 * field, delete superseded ones, but ONLY once the latest is safe to keep as the sole survivor
 * (durably applied, or old-enough-and-untracked), and NEVER touch a row that wasn't identified as
 * superseded. The compactor is hub-only (@ConditionalOnProperty), so it's constructed here against the
 * real repositories with a stub apply-state sink whose isDurableEnabled() is forced on.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:fc-compactor-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("FieldChange log compaction")
class FieldChangeCompactorIT {

    @Autowired
    private FieldChangeRepository fieldChangeRepository;
    @Autowired
    private HubChangeApplyStateRepo applyStateRepo;
    @Autowired
    private PlatformTransactionManager txManager;

    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private FieldChangeCompactor compactor;
    private final Instant now = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    /** Minimal sink — the compactor only calls isDurableEnabled() on it. */
    private HubApplyStateSink stubSink(boolean durable) {
        return new HubApplyStateSink() {
            public boolean isDurableEnabled() { return durable; }
            public void ensurePending(Collection<FieldChange> c) { }
            public void persistTerminal(Map<UUID, ChangeDisposition> d) { }
            public void bumpRetryable(Map<UUID, ChangeDisposition> d) { }
        };
    }

    @BeforeEach
    void wire() {
        compactor = new FieldChangeCompactor(fieldChangeRepository, applyStateRepo, stubSink(true), txManager);
        ReflectionTestUtils.setField(compactor, "compactionEnabled", true);
        ReflectionTestUtils.setField(compactor, "pageSize", 200);
        ReflectionTestUtils.setField(compactor, "deleteBatch", 500);
        ReflectionTestUtils.setField(compactor, "minAgeHours", 24L);
    }

    private TransactionTemplate tx() {
        return new TransactionTemplate(txManager);
    }

    /** Insert a FieldChange. disposition null → no apply-state row; else seed a row with that disposition. */
    private UUID change(String et, long eid, String fn, String val, Instant ts, String disposition) {
        UUID id = UUID.randomUUID();
        tx().executeWithoutResult(s -> {
            FieldChange c = new FieldChange(et, eid, fn, null, "\"" + val + "\"",
                    "REMOTE", "remote-machine", FieldChange.ChangeType.UPDATE);
            c.setId(id);
            c.setTimestamp(ts);
            fieldChangeRepository.save(c);
            if (disposition != null) {
                HubChangeApplyState st = new HubChangeApplyState();
                st.setChangeId(id);
                st.setDisposition(disposition);
                st.setEntityType(et);
                st.setEntityId(eid);
                st.setFirstSeenAt(now);
                applyStateRepo.save(st);
            }
        });
        return id;
    }

    private long rowsFor(String et, long eid, String fn) {
        return fieldChangeRepository.findAllForKey(et, eid, fn).size();
    }

    private boolean exists(UUID id) {
        return fieldChangeRepository.existsById(id);
    }

    @Test
    @DisplayName("collapses a field to its latest row when the latest is durably applied")
    void compactsSupersededWhenLatestApplied() {
        UUID old1 = change("LotoPoint", 700, "description", "v1", now.minusSeconds(30), "APPLIED");
        UUID old2 = change("LotoPoint", 700, "description", "v2", now.minusSeconds(20), "APPLIED");
        UUID latest = change("LotoPoint", 700, "description", "v3", now.minusSeconds(10), "APPLIED");

        compactor.runCompaction();

        assertThat(rowsFor("LotoPoint", 700, "description")).isEqualTo(1);
        assertThat(exists(latest)).as("the latest is always kept").isTrue();
        assertThat(exists(old1)).isFalse();
        assertThat(exists(old2)).isFalse();
    }

    @Test
    @DisplayName("GATE: does NOT compact when the latest change is deferred (not durably applied)")
    void doesNotCompactWhenLatestDeferred() {
        UUID appliedOld = change("Equipment", 800, "location", "A", now.minusSeconds(30), "APPLIED");
        // The latest value's replacement never applied (e.g. a deferred FK) — a non-terminal-good row.
        UUID deferredLatest = change("Equipment", 800, "location", "B", now.minusSeconds(10), "DEFERRED");

        compactor.runCompaction();

        assertThat(rowsFor("Equipment", 800, "location"))
                .as("keep both — deleting the applied older value would erase the hub's real current state")
                .isEqualTo(2);
        assertThat(exists(appliedOld)).isTrue();
        assertThat(exists(deferredLatest)).isTrue();
    }

    @Test
    @DisplayName("age fallback: compacts an OLD untracked latest (pre-durable backlog / aged-out gate row)")
    void compactsOldUntrackedLatest() {
        // No apply-state rows at all (the pre-durable backlog), and the latest is older than minAgeHours.
        UUID old1 = change("Loto", 850, "status", "s1", now.minus(72, ChronoUnit.HOURS), null);
        UUID latest = change("Loto", 850, "status", "s2", now.minus(48, ChronoUnit.HOURS), null);

        compactor.runCompaction();

        assertThat(rowsFor("Loto", 850, "status")).isEqualTo(1);
        assertThat(exists(latest)).isTrue();
        assertThat(exists(old1)).isFalse();
    }

    @Test
    @DisplayName("age fallback: does NOT compact a RECENT untracked latest (may not be applied yet)")
    void doesNotCompactRecentUntrackedLatest() {
        UUID old1 = change("Loto", 860, "status", "s1", now.minusSeconds(30), null);
        UUID latest = change("Loto", 860, "status", "s2", now.minusSeconds(10), null); // within minAgeHours

        compactor.runCompaction();

        assertThat(rowsFor("Loto", 860, "status"))
                .as("a recent untracked latest isn't proven applied — keep everything").isEqualTo(2);
        assertThat(exists(old1)).isTrue();
        assertThat(exists(latest)).isTrue();
    }

    @Test
    @DisplayName("leaves _entity_ CREATE/DELETE markers untouched (load-bearing exclusion)")
    void leavesEntityMarkersAlone() {
        UUID createMarker = markerChange("LotoPoint", 900, FieldChange.ChangeType.CREATE, "CREATED", now.minusSeconds(30));
        UUID deleteMarker = markerChange("LotoPoint", 900, FieldChange.ChangeType.DELETE, "DELETED", now.minusSeconds(10));

        compactor.runCompaction();

        assertThat(rowsFor("LotoPoint", 900, "_entity_")).isEqualTo(2);
        assertThat(exists(createMarker)).isTrue();
        assertThat(exists(deleteMarker)).isTrue();
    }

    @Test
    @DisplayName("a newer row added after the applied latest is never deleted (delete-by-id is concurrency-safe)")
    void neverDeletesANewerRow() {
        UUID old = change("LotoPoint", 1000, "description", "v1", now.minusSeconds(30), "APPLIED");
        UUID latestApplied = change("LotoPoint", 1000, "description", "v2", now.minusSeconds(20), "APPLIED");
        // A brand-new edit lands (newer than the applied latest) and is NOT yet applied.
        UUID newerPending = change("LotoPoint", 1000, "description", "v3", now.minusSeconds(10), "PENDING");

        compactor.runCompaction();

        // The real latest (v3) is not terminal-good → the whole key is gated → nothing is deleted.
        assertThat(exists(newerPending)).as("a newer, not-yet-applied row must never be deleted").isTrue();
        assertThat(exists(latestApplied)).isTrue();
        assertThat(exists(old)).isTrue();
    }

    @Test
    @DisplayName("isActive() follows the apply-state sink (needs durable-apply-state, which needs apply-lww)")
    void isActiveFollowsSink() {
        FieldChangeCompactor c = new FieldChangeCompactor(fieldChangeRepository, applyStateRepo, stubSink(false), txManager);
        ReflectionTestUtils.setField(c, "compactionEnabled", true);
        ReflectionTestUtils.setField(c, "minAgeHours", 24L);
        assertThat(c.isActive()).as("gate reads apply-state, so it must be genuinely maintained").isFalse();

        UUID a = change("Loto", 1100, "status", "s1", now.minus(72, ChronoUnit.HOURS), "APPLIED");
        UUID b = change("Loto", 1100, "status", "s2", now.minus(48, ChronoUnit.HOURS), "APPLIED");
        c.runCompaction();
        assertThat(exists(a)).as("inert compactor deletes nothing").isTrue();
        assertThat(exists(b)).isTrue();
    }

    private UUID markerChange(String et, long eid, FieldChange.ChangeType type, String val, Instant ts) {
        UUID id = UUID.randomUUID();
        tx().executeWithoutResult(s -> {
            FieldChange c = new FieldChange(et, eid, "_entity_", null, val, "REMOTE", "remote-machine", type);
            c.setId(id);
            c.setTimestamp(ts);
            fieldChangeRepository.save(c);
        });
        return id;
    }
}
