package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
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
 * The @ManyToMany membership OR-Set (sync.membership.orset.enabled=true) converges under concurrency
 * — the cases the whole-set snapshot + single-LWW-winner apply (and the reverted naive delta+bypass)
 * could not. See project/features/sync-and-backup/m2m-membership-convergence.md.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:m2m-orset-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false",
        "sync.membership.orset.enabled=true"
})
@DisplayName("ManyToMany membership OR-Set converges")
class MembershipCrdtConvergenceIT {

    @Autowired private FieldSyncService fieldSyncService;
    @Autowired private EquipmentRepo equipmentRepo;
    @Autowired private LotoPointRepo lotoPointRepo;
    @Autowired private FieldChangeRepository fieldChangeRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private WorkAreaGitHubPublisher workAreaGitHubPublisher;

    @Test
    @DisplayName("Concurrent adds of different elements both survive")
    void concurrentAdds_bothSurvive() {
        LotoPoint a = point("ORS-A"), b = point("ORS-B"), c = point("ORS-C");
        Long eq = equipment("ORS-CONC");
        insertJoin(eq, a.getId()); // base {A}
        reset();

        apply(m2m(eq, ids(a), ids(a, b), 60));    // node1: +B
        apply(m2m(eq, ids(a), ids(a, c), 120));   // node2 (later): +C

        assertThat(joinRows(eq)).containsExactlyInAnyOrder(a.getId(), b.getId(), c.getId());
    }

    @Test
    @DisplayName("Same-element add then remove converges to REMOVE regardless of apply order")
    void sameElementAddRemove_orderIndependent() {
        LotoPoint a = point("ORS-SE-A"), p = point("ORS-SE-P");
        FieldChange add = m2m(0L, ids(a), ids(a, p), 60);      // +P @T1
        FieldChange remove = m2m(0L, ids(a, p), ids(a), 120);  // -P @T2 > T1  (remove must win)

        // order 1: add then remove
        Long eq1 = equipment("ORS-SE1"); insertJoin(eq1, a.getId()); reset();
        apply(rebind(add, eq1)); apply(rebind(remove, eq1));
        assertThat(joinRows(eq1)).containsExactly(a.getId());

        // order 2: remove then add (out of order) — must reach the SAME state
        Long eq2 = equipment("ORS-SE2"); insertJoin(eq2, a.getId()); reset();
        apply(rebind(remove, eq2)); apply(rebind(add, eq2));
        assertThat(joinRows(eq2)).containsExactly(a.getId());
    }

    @Test
    @DisplayName("Concurrent remove + add of different elements both take effect")
    void concurrentRemoveAndAdd() {
        LotoPoint a = point("ORS-RA-A"), b = point("ORS-RA-B"), c = point("ORS-RA-C");
        Long eq = equipment("ORS-RA");
        insertJoin(eq, a.getId()); insertJoin(eq, b.getId()); // base {A,B}
        reset();

        apply(m2m(eq, ids(a, b), ids(a), 60));            // -B
        apply(m2m(eq, ids(a, b), ids(a, b, c), 120));     // +C

        assertThat(joinRows(eq)).containsExactlyInAnyOrder(a.getId(), c.getId());
    }

    @Test
    @DisplayName("FK-deferral re-delivery: add deferred, remove acked, add re-pulled → still absent (the divergence case)")
    void fkDeferralReDelivery_converges() {
        LotoPoint a = point("ORS-FK-A");
        Long eq = equipment("ORS-FK");
        insertJoin(eq, a.getId());
        reset();

        Long missingP = 900_000_099_777L; // a point that does not exist locally yet

        // add P @T1 — P missing → deferred (not applied)
        FieldChange add = m2m(eq, ids(a), "[" + a.getId() + "," + missingP + "]", 60);
        assertThat(apply(add)).isZero();
        assertThat(joinRows(eq)).containsExactly(a.getId());

        // remove P @T2 > T1 — applies (no-op delete), records the REMOVE tombstone
        FieldChange remove = m2m(eq, "[" + a.getId() + "," + missingP + "]", ids(a), 120);
        apply(remove);

        // P now exists; the deferred add is re-pulled ALONE and applies
        LotoPoint p = new LotoPoint();
        p.setId(missingP);
        p.setTagNumber("ORS-FK-P");
        new TransactionTemplate(transactionManager).executeWithoutResult(s -> entityManager.merge(p));
        reset();
        apply(m2m(eq, ids(a), "[" + a.getId() + "," + missingP + "]", 60));

        // Converges: the older add (@T1) loses to the newer remove (@T2) per-element → P stays absent.
        assertThat(joinRows(eq)).containsExactly(a.getId());
    }

    @Test
    @DisplayName("Re-applying the same change is idempotent")
    void idempotentReapply() {
        LotoPoint a = point("ORS-ID-A"), b = point("ORS-ID-B");
        Long eq = equipment("ORS-ID");
        insertJoin(eq, a.getId());
        reset();

        FieldChange add = m2m(eq, ids(a), ids(a, b), 60);
        apply(add);
        apply(add); // same change again

        assertThat(joinRows(eq)).containsExactlyInAnyOrder(a.getId(), b.getId());
    }

    // ---- helpers ----

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

    private void reset() {
        fieldChangeRepository.deleteAll();
        entityManager.clear();
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

    private FieldChange rebind(FieldChange src, Long eqId) {
        FieldChange c = m2m(eqId, src.getOldValue(), src.getNewValue(), 0);
        c.setTimestamp(src.getTimestamp()); // preserve the relative order (T1 < T2)
        return c;
    }
}
