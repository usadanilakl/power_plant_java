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
        "spring.datasource.url=jdbc:h2:mem:m2m-owner-remap-apply-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("ManyToMany sync resolves remapped owners")
class ManyToManyOwnerRemapApplyIT {

    @Autowired private FieldSyncService fieldSyncService;
    @Autowired private EquipmentRepo equipmentRepo;
    @Autowired private LotoPointRepo lotoPointRepo;
    @Autowired private FieldChangeRepository fieldChangeRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private WorkAreaGitHubPublisher workAreaGitHubPublisher;

    @Test
    @DisplayName("Equipment.lotoPoints applies to canonical equipment when incoming owner id was remapped")
    void manyToManyApply_usesRemappedOwnerId() {
        Equipment canonicalEquipment = new Equipment();
        canonicalEquipment.setTagNumber("M2M-OWNER-REMAP");
        canonicalEquipment = equipmentRepo.saveAndFlush(canonicalEquipment);

        LotoPoint point = new LotoPoint();
        point.setTagNumber("M2M-OWNER-POINT");
        point = lotoPointRepo.saveAndFlush(point);

        Long incomingEquipmentId = 3_000_099_917L;
        Long canonicalEquipmentId = canonicalEquipment.getId();
        Long pointId = point.getId();

        new TransactionTemplate(transactionManager).executeWithoutResult(status ->
            entityManager.createNativeQuery(
                    "MERGE INTO dedup_id_remap (entity_type, original_id, remapped_id, created_at) " +
                            "KEY (entity_type, original_id) " +
                            "VALUES (:entityType, :originalId, :remappedId, :createdAt)")
                .setParameter("entityType", "Equipment")
                .setParameter("originalId", incomingEquipmentId)
                .setParameter("remappedId", canonicalEquipmentId)
                .setParameter("createdAt", Instant.now())
                .executeUpdate()
        );
        fieldChangeRepository.deleteAll();
        entityManager.clear();

        FieldChange relationshipChange = new FieldChange(
                "Equipment",
                incomingEquipmentId,
                "lotoPoints",
                "[]",
                "[" + pointId + "]",
                "CLIENT-MACHINE",
                "Client Machine",
                FieldChange.ChangeType.UPDATE
        );
        relationshipChange.setRelationshipType("ManyToMany");
        relationshipChange.setTimestamp(Instant.now().plusSeconds(60));

        int applied = fieldSyncService.applyIncomingChanges(List.of(relationshipChange));

        assertThat(applied).isEqualTo(1);
        assertJoinRows(canonicalEquipmentId, pointId);
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
