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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Log compaction (retention fix) — the safety-critical behavior: keep exactly the latest change per
 * field, delete superseded ones, but ONLY once the latest is durably applied, and NEVER touch a row
 * that wasn't identified as superseded. The compactor is hub-only (@ConditionalOnProperty), so it's
 * constructed here against the real repositories with the flags forced on.
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
    private final Instant base = Instant.now().plusSeconds(3600).truncatedTo(ChronoUnit.MILLIS);

    @BeforeEach
    void wire() {
        compactor = new FieldChangeCompactor(fieldChangeRepository, applyStateRepo, txManager);
        ReflectionTestUtils.setField(compactor, "compactionEnabled", true);
        ReflectionTestUtils.setField(compactor, "durableApplyStateEnabled", true);
        ReflectionTestUtils.setField(compactor, "pageSize", 200);
        ReflectionTestUtils.setField(compactor, "deleteBatch", 500);
    }

    private TransactionTemplate tx() {
        return new TransactionTemplate(txManager);
    }

    /** Insert a FieldChange (given key + value + timestamp). If applied, also seed an APPLIED apply-state row. */
    private UUID change(String et, long eid, String fn, String val, int tsOffsetSec, boolean applied) {
        UUID id = UUID.randomUUID();
        tx().executeWithoutResult(s -> {
            FieldChange c = new FieldChange(et, eid, fn, null, "\"" + val + "\"",
                    "REMOTE", "remote-machine", FieldChange.ChangeType.UPDATE);
            c.setId(id);
            c.setTimestamp(base.plusSeconds(tsOffsetSec));
            fieldChangeRepository.save(c);
            if (applied) {
                HubChangeApplyState st = new HubChangeApplyState();
                st.setChangeId(id);
                st.setDisposition("APPLIED");
                st.setEntityType(et);
                st.setEntityId(eid);
                st.setFirstSeenAt(base);
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
        UUID old1 = change("LotoPoint", 700, "description", "v1", 0, true);
        UUID old2 = change("LotoPoint", 700, "description", "v2", 10, true);
        UUID latest = change("LotoPoint", 700, "description", "v3", 20, true);

        compactor.runCompaction();

        assertThat(rowsFor("LotoPoint", 700, "description")).isEqualTo(1);
        assertThat(exists(latest)).as("the latest is always kept").isTrue();
        assertThat(exists(old1)).isFalse();
        assertThat(exists(old2)).isFalse();
    }

    @Test
    @DisplayName("GATE: does NOT compact when the latest change is not durably applied (still deferred)")
    void doesNotCompactWhenLatestNotTerminalGood() {
        UUID appliedOld = change("Equipment", 800, "location", "A", 0, true);
        // The latest value's replacement never applied (e.g. a deferred FK) — no apply-state row.
        UUID deferredLatest = change("Equipment", 800, "location", "B", 10, false);

        compactor.runCompaction();

        assertThat(rowsFor("Equipment", 800, "location"))
                .as("keep both — deleting the applied older value would erase the hub's real current state")
                .isEqualTo(2);
        assertThat(exists(appliedOld)).isTrue();
        assertThat(exists(deferredLatest)).isTrue();
    }

    @Test
    @DisplayName("leaves _entity_ CREATE/DELETE markers untouched (Phase 1 scope)")
    void leavesEntityMarkersAlone() {
        UUID createMarker = markerChange("LotoPoint", 900, FieldChange.ChangeType.CREATE, "CREATED", 0, true);
        UUID deleteMarker = markerChange("LotoPoint", 900, FieldChange.ChangeType.DELETE, "DELETED", 10, true);

        compactor.runCompaction();

        assertThat(rowsFor("LotoPoint", 900, "_entity_")).isEqualTo(2);
        assertThat(exists(createMarker)).isTrue();
        assertThat(exists(deleteMarker)).isTrue();
    }

    @Test
    @DisplayName("a newer row added after the applied latest is never deleted (delete-by-id is concurrency-safe)")
    void neverDeletesANewerRow() {
        UUID old = change("LotoPoint", 1000, "description", "v1", 0, true);
        UUID latestApplied = change("LotoPoint", 1000, "description", "v2", 10, true);
        // A brand-new edit lands (newer than the applied latest) and is NOT yet applied.
        UUID newerPending = change("LotoPoint", 1000, "description", "v3", 20, false);

        compactor.runCompaction();

        // The real latest (v3) is not terminal-good → the whole key is gated → nothing is deleted.
        assertThat(exists(newerPending)).as("a newer, not-yet-applied row must never be deleted").isTrue();
        assertThat(exists(latestApplied)).isTrue();
        assertThat(exists(old)).isTrue();
    }

    @Test
    @DisplayName("isActive() requires BOTH log-compaction and durable-apply-state")
    void isActiveRequiresBothFlags() {
        FieldChangeCompactor c = new FieldChangeCompactor(fieldChangeRepository, applyStateRepo, txManager);
        ReflectionTestUtils.setField(c, "compactionEnabled", true);
        ReflectionTestUtils.setField(c, "durableApplyStateEnabled", false);
        assertThat(c.isActive()).as("compaction gates on apply-state, so it needs it enabled").isFalse();
        // And a no-op run makes no changes.
        UUID a = change("Loto", 1100, "status", "s1", 0, true);
        UUID b = change("Loto", 1100, "status", "s2", 10, true);
        c.runCompaction();
        assertThat(exists(a)).isTrue();
        assertThat(exists(b)).isTrue();
    }

    private UUID markerChange(String et, long eid, FieldChange.ChangeType type, String val, int tsOffsetSec,
                              boolean applied) {
        UUID id = UUID.randomUUID();
        tx().executeWithoutResult(s -> {
            FieldChange c = new FieldChange(et, eid, "_entity_", null, val,
                    "REMOTE", "remote-machine", type);
            c.setId(id);
            c.setTimestamp(base.plusSeconds(tsOffsetSec));
            fieldChangeRepository.save(c);
            if (applied) {
                HubChangeApplyState st = new HubChangeApplyState();
                st.setChangeId(id);
                st.setDisposition("APPLIED");
                st.setEntityType(et);
                st.setEntityId(eid);
                st.setFirstSeenAt(base);
                applyStateRepo.save(st);
            }
        });
        return id;
    }
}
