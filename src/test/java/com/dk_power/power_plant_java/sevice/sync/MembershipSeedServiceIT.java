package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.sync.MembershipEventRepository;
import com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher;
import jakarta.persistence.EntityManager;
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

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Phase 1b seeder: baseline-ADDs every pre-existing owning-@ManyToMany join row into the OR-Set so the
 * flag can be turned on without the first reconcile wiping already-present members. See
 * project/features/sync-and-backup/m2m-membership-convergence.md §6.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:m2m-seed-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false",
        "sync.membership.orset.enabled=true",
        "sync.membership.orset.seed-baseline=2000-01-01T00:00:00Z"
})
@DisplayName("Phase 1b membership seeder")
class MembershipSeedServiceIT {

    @Autowired private FieldSyncService fieldSyncService;
    @Autowired private EquipmentRepo equipmentRepo;
    @Autowired private LotoPointRepo lotoPointRepo;
    @Autowired private EntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private MembershipCrdtService membershipCrdtService;
    @Autowired private MembershipEventRepository eventRepository;
    @Autowired private MembershipSeedService seedService;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private WorkAreaGitHubPublisher workAreaGitHubPublisher;

    @Test
    @DisplayName("Seeds a baseline ADD for every existing join row, then present-set == join")
    void seedsExistingJoinRows() {
        LotoPoint a = point("SEED-A"), b = point("SEED-B");
        Long eq = equipment("SEED-EQ");
        insertJoin(eq, a.getId());
        insertJoin(eq, b.getId());
        clearEvents(); // drop the startup marker so seed() re-runs against the rows we just inserted

        seedService.seed();

        assertThat(membershipCrdtService.presentSet("Equipment", eq, "lotoPoints"))
                .containsExactlyInAnyOrder(a.getId(), b.getId());
        assertThat(eventRepository.existsByOwnerType("__seed_marker__")).isTrue();
    }

    @Test
    @DisplayName("Idempotent: re-running the seed neither duplicates nor changes the present-set")
    void idempotentReseed() {
        LotoPoint a = point("SEED-ID-A");
        Long eq = equipment("SEED-ID-EQ");
        insertJoin(eq, a.getId());
        clearEvents();

        seedService.seed();
        long afterFirst = eventRepository.findByOwnerTypeAndOwnerIdAndFieldName("Equipment", eq, "lotoPoints").size();

        // Marker present → a second call is a no-op.
        seedService.seed();
        // Even forcing past the marker (drop it, keep events) upserts to the SAME rows.
        deleteMarker();
        seedService.seed();

        assertThat(eventRepository.findByOwnerTypeAndOwnerIdAndFieldName("Equipment", eq, "lotoPoints"))
                .hasSize((int) afterFirst);
        assertThat(membershipCrdtService.presentSet("Equipment", eq, "lotoPoints"))
                .containsExactly(a.getId());
    }

    @Test
    @DisplayName("Seeded member is visible to a later reconcile-to-empty and gets removed (no stale join row)")
    void seededMemberRemovedByReconcileToEmpty() {
        LotoPoint a = point("SEED-RC-A");
        Long eq = equipment("SEED-RC-EQ");
        insertJoin(eq, a.getId());
        clearEvents();
        seedService.seed(); // ADD(a)@baseline; join {a}

        // A whole-set reconcile-to-empty @now (> baseline) — e.g. "Use Hub" to a hub state without A.
        apply(reconcile(eq, "[]", 120));

        // Without the seed, allElementIds would not include A and the join row would be left stale.
        assertThat(joinRows(eq)).isEmpty();
    }

    @Test
    @DisplayName("Seeded members coexist with a concurrent peer add (delta) — both survive")
    void seededCoexistsWithPeerAdd() {
        LotoPoint a = point("SEED-CO-A"), b = point("SEED-CO-B");
        Long eq = equipment("SEED-CO-EQ");
        insertJoin(eq, a.getId());
        clearEvents();
        seedService.seed(); // {a}

        apply(m2m(eq, ids(a), ids(a, b), 120)); // peer delta: +B @now

        assertThat(joinRows(eq)).containsExactlyInAnyOrder(a.getId(), b.getId());
    }

    // ---- helpers ----

    private void clearEvents() {
        new TransactionTemplate(transactionManager).executeWithoutResult(s ->
            entityManager.createNativeQuery("DELETE FROM membership_event").executeUpdate());
    }

    private void deleteMarker() {
        new TransactionTemplate(transactionManager).executeWithoutResult(s ->
            entityManager.createNativeQuery("DELETE FROM membership_event WHERE owner_type = '__seed_marker__'").executeUpdate());
    }

    private LotoPoint point(String tag) {
        LotoPoint p = new LotoPoint();
        p.setTagNumber(tag);
        return lotoPointRepo.saveAndFlush(p);
    }

    private Long equipment(String tag) {
        Equipment e = new Equipment();
        e.setTagNumber(tag);
        return equipmentRepo.saveAndFlush(e).getId();
    }

    private void insertJoin(Long eq, Long pointId) {
        new TransactionTemplate(transactionManager).executeWithoutResult(s ->
            entityManager.createNativeQuery(
                    "INSERT INTO eq_loto_point (eq_id, loto_point_id) VALUES (:e, :p)")
                .setParameter("e", eq).setParameter("p", pointId).executeUpdate());
    }

    private int apply(FieldChange c) {
        return fieldSyncService.applyIncomingChanges(List.of(c));
    }

    @SuppressWarnings("unchecked")
    private List<Long> joinRows(Long eq) {
        List<Number> rows = entityManager.createNativeQuery(
                "SELECT loto_point_id FROM eq_loto_point WHERE eq_id = :e")
            .setParameter("e", eq).getResultList();
        return rows.stream().map(Number::longValue).toList();
    }

    private static String ids(LotoPoint... points) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < points.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(points[i].getId());
        }
        return sb.append("]").toString();
    }

    private FieldChange m2m(Long eqId, String oldValue, String newValue, long tsOffset) {
        FieldChange c = new FieldChange("Equipment", eqId, "lotoPoints", oldValue, newValue,
                "LEADS-OFFICE-PC", "Leads Office PC", FieldChange.ChangeType.UPDATE);
        c.setRelationshipType("ManyToMany");
        c.setTimestamp(Instant.now().plusSeconds(tsOffset));
        return c;
    }

    private FieldChange reconcile(Long eqId, String newValue, long tsOffset) {
        FieldChange c = new FieldChange("Equipment", eqId, "lotoPoints", null, newValue,
                "LEADS-OFFICE-PC", "Leads Office PC", FieldChange.ChangeType.UPDATE);
        c.setRelationshipType("ManyToMany");
        c.setTimestamp(Instant.now().plusSeconds(tsOffset));
        return c;
    }
}
