package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.repository.sync.HubChangeApplyStateRepo;
import com.dk_power.power_plant_java.sevice.sync.FieldSyncService;
import com.dk_power.power_plant_java.sevice.sync.HubApplyStateSink;
import com.dk_power.power_plant_java.sevice.sync.SyncDeadLetterService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * The post-boot startup grace: give-up valves must be HELD for {@code startup-grace-minutes} after the
 * process starts, so a long outage (whose wall-clock burned the age windows while nothing could arrive)
 * cannot dead-letter changes the instant the hub returns — they get retried and clients get time to
 * re-send parents first. Plain unit test (no Spring context) — the decision is pure time math.
 */
@DisplayName("HubApplyStateRecovery startup grace")
class HubApplyStateRecoveryGraceTest {

    private HubApplyStateRecovery newRecovery() {
        return new HubApplyStateRecovery(
                mock(HubChangeApplyStateRepo.class),
                mock(FieldChangeRepository.class),
                mock(FieldSyncService.class),
                mock(HubApplyStateSink.class),
                mock(SyncDeadLetterService.class),
                mock(SyncConfig.class),
                mock(PlatformTransactionManager.class));
    }

    @Test
    @DisplayName("valves are held for the grace window after boot, then resume")
    void withinStartupGrace_holdsValvesAfterBootThenResumes() {
        HubApplyStateRecovery r = newRecovery();
        ReflectionTestUtils.setField(r, "startupGraceMinutes", 60L);

        // Just booted (even after a 3-day outage, processStartedAt is ~now) — valves must be held.
        ReflectionTestUtils.setField(r, "processStartedAt", Instant.now());
        assertThat(r.withinStartupGrace()).as("freshly booted — no give-up valve may fire").isTrue();

        // Uptime now exceeds the grace window — steady state, valves resume.
        ReflectionTestUtils.setField(r, "processStartedAt", Instant.now().minus(2, ChronoUnit.HOURS));
        assertThat(r.withinStartupGrace()).as("past the grace window — valves resume").isFalse();
    }
}
