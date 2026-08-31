package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.WorkAreaDto;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression: a partial WorkArea update with {@code constantLotoIds == null} must LEAVE the association
 * alone (null = "no opinion"), not wipe it. The old code collapsed null into {@code new HashSet<>()},
 * which emptied the area's LOTO standards AND — because
 * {@code FieldChangeTracker.trackRelationshipUpdateInCurrentTx} emits the M2M change — broadcast that
 * wipe to every node. See [[feedback_m2m_null_empty_save_contract]].
 *
 * <p>Red before the fix (set wiped to 0 + a spurious constantLotos FieldChange), green after. A positive
 * control proves a genuine change still applies and still emits, so the fix didn't disable real syncing.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:workarea-m2m-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("WorkArea constantLotos: null id-list must not wipe-and-propagate (prod 2026-08-29)")
@Transactional
@Rollback(false)
class WorkAreaConstantLotosSyncIT {

    @Autowired private WorkAreaRepo workAreaRepo;
    @Autowired private LotoStandardRepo lotoStandardRepo;
    @Autowired private FieldChangeRepository fieldChangeRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private NgWorkAreaService workAreaService;

    // Boot-only mocks: RedTag needs SikuliX; the GitHub publisher would hit the network on save.
    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher workAreaGitHubPublisher;

    @Test
    @DisplayName("null constantLotoIds leaves the set intact and emits no wipe")
    void nullConstantLotoIds_preservesSet_andEmitsNoWipe() {
        LotoStandard s1 = lotoStandardRepo.saveAndFlush(new LotoStandard());
        LotoStandard s2 = lotoStandardRepo.saveAndFlush(new LotoStandard());
        WorkArea wa = new WorkArea();
        wa.setName("Area A");
        wa.getConstantLotos().add(s1);
        wa.getConstantLotos().add(s2);
        workAreaRepo.saveAndFlush(wa);
        Long waId = wa.getId();
        commit();

        assertThat(joinRows(waId)).as("seed: area has 2 constant LOTO standards").isEqualTo(2L);
        long changesBefore = constantLotosChangeCount(waId);

        // Partial update — everything about constantLotos is omitted (null). Only the name changes.
        WorkAreaDto dto = new WorkAreaDto();
        dto.setId(waId);
        dto.setName("Area A (renamed)");
        dto.setConstantLotoIds(null);   // the dangerous omission
        dto.setLocationIds(null);
        workAreaService.saveFromDto(dto);
        commit();

        // ── decisive assertions ─────────────────────────────────────────────
        assertThat(joinRows(waId))
                .as("null constantLotoIds must LEAVE the association alone (pre-fix wiped it to 0)")
                .isEqualTo(2L);
        assertThat(constantLotosChangeCount(waId))
                .as("no constantLotos FieldChange may be emitted for a null (no-op) update — a wipe would propagate to every node")
                .isEqualTo(changesBefore);
        // and the real edit still took effect
        assertThat(entityManager.createNativeQuery("SELECT name FROM work_area WHERE id = " + waId).getSingleResult())
                .isEqualTo("Area A (renamed)");
    }

    @Test
    @DisplayName("positive control: an explicit id-list replaces the set AND emits a FieldChange")
    void explicitConstantLotoIds_replacesAndEmits() {
        LotoStandard s1 = lotoStandardRepo.saveAndFlush(new LotoStandard());
        LotoStandard s2 = lotoStandardRepo.saveAndFlush(new LotoStandard());
        WorkArea wa = new WorkArea();
        wa.setName("Area B");
        wa.getConstantLotos().add(s1);
        wa.getConstantLotos().add(s2);
        workAreaRepo.saveAndFlush(wa);
        Long waId = wa.getId();
        commit();

        long changesBefore = constantLotosChangeCount(waId);

        // Explicit list dropping s2 → a genuine membership change.
        WorkAreaDto dto = new WorkAreaDto();
        dto.setId(waId);
        dto.setName("Area B");
        dto.setConstantLotoIds(List.of(s1.getId()));
        workAreaService.saveFromDto(dto);
        commit();

        assertThat(joinRows(waId))
                .as("explicit single-id list replaces the set (s2 removed)")
                .isEqualTo(1L);
        assertThat(constantLotosChangeCount(waId))
                .as("a real membership change still emits a constantLotos FieldChange (syncing not disabled)")
                .isGreaterThan(changesBefore);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private long joinRows(Long waId) {
        return ((Number) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM work_area_loto_standard WHERE work_area_id = " + waId)
                .getSingleResult()).longValue();
    }

    private long constantLotosChangeCount(Long waId) {
        List<FieldChange> all = fieldChangeRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("WorkArea", waId);
        return all.stream().filter(fc -> "constantLotos".equals(fc.getFieldName())).count();
    }

    private void commit() {
        TestTransaction.flagForCommit();
        TestTransaction.end();
        TestTransaction.start();
    }
}
