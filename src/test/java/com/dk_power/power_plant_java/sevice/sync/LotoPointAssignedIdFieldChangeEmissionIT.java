package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.sync.FieldChange;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.sync.FieldChangeRepository;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:loto-point-assigned-id-fc-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("LotoPoint assigned-ID FieldChange emission")
@Transactional
@Rollback(false)
class LotoPointAssignedIdFieldChangeEmissionIT {

    @Autowired private NgLotoPointService lotoPointService;
    @Autowired private FieldChangeRepository fieldChangeRepository;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private WorkAreaGitHubPublisher workAreaGitHubPublisher;

    @Test
    @DisplayName("New LotoPoint with preassigned ID emits CREATE history")
    void assignedIdCreate_emitsCreateHistory() {
        long assignedId = 1_000_089_999L;
        LotoPointIdDto dto = new LotoPointIdDto();
        dto.setId(assignedId);
        dto.setTagNumber("SYNC-ASSIGNED-ID-LP");
        dto.setDescription("Assigned ID sync test point");
        dto.setSpecificLocation("Test location");
        dto.setEquipmentIdList(List.of());

        LotoPoint saved = lotoPointService.processLotoPoint(dto);

        assertThat(saved.getId()).isEqualTo(assignedId);
        assertThat(fieldChangeRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("LotoPoint", assignedId))
                .as("assigned-ID create should emit a CREATE marker and scalar field rows")
                .anyMatch(fc -> fc.getChangeType() == FieldChange.ChangeType.CREATE
                        && "_entity_".equals(fc.getFieldName()))
                .anyMatch(fc -> "tagNumber".equals(fc.getFieldName())
                        && "SYNC-ASSIGNED-ID-LP".equals(fc.getNewValue().replace("\"", "")))
                .anyMatch(fc -> "description".equals(fc.getFieldName())
                        && "Assigned ID sync test point".equals(fc.getNewValue().replace("\"", "")));
    }
}
