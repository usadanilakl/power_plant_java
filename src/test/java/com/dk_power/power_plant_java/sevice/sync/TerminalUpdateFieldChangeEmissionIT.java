package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression guard for the terminal-update change-log loss (root cause of "LOTO permit synced but
 * the hung/approved lifecycle never reached the client").
 *
 * <p>UPDATE FieldChange rows are emitted from {@code @PostUpdate}, which fires DURING the caller's
 * commit-time flush. For a "terminal" update — an entity dirtied and then the transaction returns
 * with no subsequent flush (exactly the LOTO snapshot lifecycle transitions:
 * {@code approveForHanging}/{@code markHung} mutate the managed snapshot in place, then return) — a
 * JPA {@code saveAll} there only enqueued a write-behind insert Hibernate never re-drained, so the
 * change-log row was silently dropped while the entity's own UPDATE committed. The fix INSERTs these
 * rows directly on the transaction's own JDBC connection, which is durable through the terminal flush
 * AND atomic with the entity UPDATE.
 *
 * <p>This IT reproduces the exact mechanism with a plain {@link LotoPoint} (no LOTO auth/permit
 * machinery), so it is deterministic and runnable in isolation.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:terminal-update-fc-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("Terminal-update FieldChange emission (durability + rollback atomicity)")
class TerminalUpdateFieldChangeEmissionIT {

    @PersistenceContext
    private EntityManager entityManager;
    @Autowired
    private FieldChangeRepository fieldChangeRepository;
    @Autowired
    private PlatformTransactionManager txManager;

    // Raw persist doesn't invoke these, but keep the context identical to the sibling emission ITs.
    @MockBean
    private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean
    private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    @Test
    @DisplayName("a terminal scalar update (no post-mutation flush) persists its UPDATE FieldChange row")
    void terminalUpdate_persistsUpdateFieldChange() {
        TransactionTemplate tx = new TransactionTemplate(txManager);

        // tx1: create + commit the point, so the later update has a committed DB snapshot to diff against.
        long id = tx.execute(s -> {
            LotoPoint p = new LotoPoint();
            p.setTagNumber("TERM-UPD-1");
            p.setDescription("orig");
            p.setSpecificLocation("orig-loc");
            entityManager.persist(p);
            return p.getId();
        });

        // Clear the outbox (drops the CREATE rows from tx1) so we assert precisely on the update below.
        tx.executeWithoutResult(s -> entityManager.createQuery("DELETE FROM FieldChange").executeUpdate());

        // tx2: TERMINAL update — mutate one scalar, return, commit. NO query/flush after the mutation
        // (an auto-flush would drain the ActionQueue and hide the pre-fix loss). Same shape as a LOTO
        // snapshot lifecycle transition.
        tx.executeWithoutResult(s -> {
            LotoPoint p = entityManager.find(LotoPoint.class, id);
            p.setSpecificLocation("moved-terminal");
        });

        List<FieldChange> rows = fieldChangeRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("LotoPoint", id);
        assertThat(rows)
                .as("a terminal scalar update must persist an UPDATE FieldChange (was silently lost before the fix)")
                .anyMatch(fc -> fc.getChangeType() == FieldChange.ChangeType.UPDATE
                        && "specificLocation".equals(fc.getFieldName())
                        && fc.getNewValue() != null && fc.getNewValue().contains("moved-terminal")
                        && !fc.isSyncedTo("SERVER"));
    }

    @Test
    @DisplayName("a rolled-back terminal update leaks NO FieldChange row (same-connection atomicity)")
    void rolledBackTerminalUpdate_leaksNoFieldChange() {
        TransactionTemplate tx = new TransactionTemplate(txManager);

        long id = tx.execute(s -> {
            LotoPoint p = new LotoPoint();
            p.setTagNumber("TERM-UPD-2");
            p.setDescription("orig");
            p.setSpecificLocation("orig-loc");
            entityManager.persist(p);
            return p.getId();
        });
        tx.executeWithoutResult(s -> entityManager.createQuery("DELETE FROM FieldChange").executeUpdate());

        // Mutate, force the flush (so the FieldChange INSERT actually executes on the connection), then
        // roll back. Because the INSERT rides the SAME JDBC connection as the entity UPDATE, it must roll
        // back with it — no phantom outbound row. (A separate-tx emission would leak here.)
        tx.executeWithoutResult(s -> {
            LotoPoint p = entityManager.find(LotoPoint.class, id);
            p.setSpecificLocation("should-roll-back");
            entityManager.flush();
            s.setRollbackOnly();
        });

        assertThat(fieldChangeRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("LotoPoint", id))
                .as("a rolled-back terminal update must not leak a FieldChange row")
                .noneMatch(fc -> fc.getChangeType() == FieldChange.ChangeType.UPDATE);
    }
}
