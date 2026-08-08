package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.sync.MembershipEvent;
import com.dk_power.power_plant_java.repository.sync.MembershipEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies {@link MembershipEventCheckConstraintFixer} does its production job: a node that ran the
 * pre-RESET OR-Set build has a {@code membership_event} CHECK constraint hard-coding
 * {@code op IN ('ADD','REMOVE')}, which crashes the new build's first {@code RESET} write. The fixer must
 * drop it at startup so RESET is accepted — without any manual DB surgery on the fleet.
 *
 * <p>The stale constraint is simulated with an explicit {@code ALTER} (H2 auto-names its own, but the
 * fixer finds constraints by clause, not by name, so a named stand-in is representative).
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:membership-ck-fixer-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("membership_event stale op CHECK-constraint fixer")
class MembershipEventCheckConstraintFixerIT {

    @Autowired private MembershipEventCheckConstraintFixer fixer;
    @Autowired private DataSource dataSource;
    @Autowired private MembershipEventRepository eventRepository;
    @Autowired private PlatformTransactionManager txManager;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    private void exec(String sql) throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute(sql);
        }
    }

    @BeforeEach
    void clean() throws Exception {
        // The in-mem DB persists across this class's methods (DB_CLOSE_DELAY=-1, no per-method cleanup);
        // start each test from a clean slate so a RESET row committed by one test can't block the other's
        // stale-constraint ALTER.
        exec("ALTER TABLE membership_event DROP CONSTRAINT IF EXISTS stale_op_ck");
        exec("DELETE FROM membership_event");
    }

    private Long saveReset() {
        return new TransactionTemplate(txManager).execute(status -> {
            MembershipEvent e = new MembershipEvent("Equipment", 1L, "lotoPoints", -1L,
                    MembershipEvent.Op.RESET, Instant.now(), "test-origin", UUID.randomUUID());
            return eventRepository.saveAndFlush(e).getId();
        });
    }

    @Test
    @DisplayName("drops the stale ADD/REMOVE-only constraint so a RESET write then succeeds")
    void dropsStaleConstraint_soResetInsertsSucceed() throws Exception {
        // Start clean (the startup fixer has run) — simulate a pre-RESET node.
        exec("ALTER TABLE membership_event ADD CONSTRAINT stale_op_ck CHECK (op IN ('ADD','REMOVE'))");

        // The production crash: RESET is rejected by the stale constraint.
        assertThatThrownBy(this::saveReset)
                .as("a pre-RESET ADD/REMOVE-only constraint rejects the RESET barrier write")
                .isInstanceOf(Exception.class);

        // The fixer drops it.
        fixer.fixCheckConstraints();

        // RESET now persists cleanly — the reconcile / "Use Hub" barrier works on an upgraded node.
        Long id = saveReset();
        assertThat(id).as("RESET accepted after the fixer dropped the stale constraint").isNotNull();
    }

    @Test
    @DisplayName("idempotent + fleet-safe: running with no stale constraint neither errors nor blocks RESET")
    void noStaleConstraint_isNoOp() {
        // A fresh node has no stale constraint; the fixer must be a harmless no-op and RESET must work.
        fixer.fixCheckConstraints();
        assertThat(saveReset()).isNotNull();
    }
}
