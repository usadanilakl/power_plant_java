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

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:m2m-incomplete-apply-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("ManyToMany sync applies atomically")
class ManyToManyIncompleteApplyIT {

    @Autowired private FieldSyncService fieldSyncService;
    @Autowired private EquipmentRepo equipmentRepo;
    @Autowired private LotoPointRepo lotoPointRepo;
    @Autowired private FieldChangeRepository fieldChangeRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private WorkAreaGitHubPublisher workAreaGitHubPublisher;

    @Test
    @DisplayName("Incomplete Equipment.lotoPoints update leaves existing join rows untouched until all referenced points exist")
    void incompleteManyToManyApply_doesNotDeleteExistingJoinRows() {
        LotoPoint existingPoint = new LotoPoint();
        existingPoint.setTagNumber("M2M-EXISTING");
        existingPoint = lotoPointRepo.saveAndFlush(existingPoint);

        Equipment equipment = new Equipment();
        equipment.setTagNumber("M2M-EQ");
        equipment = equipmentRepo.saveAndFlush(equipment);

        Long equipmentId = equipment.getId();
        Long existingPointId = existingPoint.getId();
        Long missingPointId = 1_000_099_991L;
        new TransactionTemplate(transactionManager).executeWithoutResult(status ->
            entityManager.createNativeQuery(
                    "INSERT INTO eq_loto_point (eq_id, loto_point_id) VALUES (:equipmentId, :pointId)")
                .setParameter("equipmentId", equipmentId)
                .setParameter("pointId", existingPointId)
                .executeUpdate()
        );
        fieldChangeRepository.deleteAll();
        entityManager.clear();

        FieldChange incompleteChange = manyToManyChange(equipmentId, "[" + missingPointId + "]", 60);

        int applied = fieldSyncService.applyIncomingChanges(List.of(incompleteChange));

        assertThat(applied).isZero();
        assertJoinRows(equipmentId, existingPointId);

        LotoPoint nowExistingPoint = new LotoPoint();
        nowExistingPoint.setId(missingPointId);
        nowExistingPoint.setTagNumber("M2M-NOW-EXISTS");
        new TransactionTemplate(transactionManager).executeWithoutResult(status ->
            entityManager.merge(nowExistingPoint)
        );
        fieldChangeRepository.deleteAll();
        entityManager.clear();

        FieldChange completeChange = manyToManyChange(equipmentId, "[" + missingPointId + "]", 120);

        int appliedAfterReferenceExists = fieldSyncService.applyIncomingChanges(List.of(completeChange));

        assertThat(appliedAfterReferenceExists).isEqualTo(1);
        assertJoinRows(equipmentId, missingPointId);
    }

    private FieldChange manyToManyChange(Long equipmentId, String newValue, long timestampOffsetSeconds) {
        FieldChange change = new FieldChange(
                "Equipment",
                equipmentId,
                "lotoPoints",
                "[]",
                newValue,
                "LEADS-OFFICE-PC",
                "Leads Office PC",
                FieldChange.ChangeType.UPDATE
        );
        change.setRelationshipType("ManyToMany");
        change.setTimestamp(Instant.now().plusSeconds(timestampOffsetSeconds));
        return change;
    }

    private void assertJoinRows(Long equipmentId, Long... expectedPointIds) {
        @SuppressWarnings("unchecked")
        List<Number> rows = entityManager.createNativeQuery(
                "SELECT loto_point_id FROM eq_loto_point WHERE eq_id = :equipmentId ORDER BY loto_point_id")
            .setParameter("equipmentId", equipmentId)
            .getResultList();

        assertThat(rows.stream().map(Number::longValue).toList())
            .containsExactly(expectedPointIds);
    }
}
