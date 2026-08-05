package com.dk_power.power_plant_java.loto;

import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher;
import org.hibernate.LazyInitializationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Regression for the hub "Failed to save LOTO point" 400: the create/update controller converted the
 * saved entity to a DTO AFTER {@code processLotoPoint}'s transaction returned. With
 * {@code open-in-view=false} the entity is detached by then, and {@code LotoPointMapper.convertToDto}
 * walks the lazy {@code pictures} @ManyToMany (which {@code processLotoPoint} does not eager-fetch),
 * throwing {@code LazyInitializationException}. The point committed but the response failed with a
 * misleading 400. Fix: {@code processLotoPointToDto} converts inside the service transaction.
 *
 * <p>Deliberately NOT {@code @Transactional} — so {@code processLotoPoint}'s own transaction commits and
 * the returned entity DETACHES, reproducing the production condition (a {@code @Transactional} test keeps
 * one session open for the whole test and cannot reproduce it).
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:loto-point-convertintx-it;DB_CLOSE_DELAY=-1;MODE=LEGACY",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "test.cleanup.enabled=false"
})
@DisplayName("LotoPoint create/update converts to DTO in-transaction (no LazyInitializationException)")
class LotoPointCreateConvertInTxIT {

    @Autowired private NgLotoPointService lotoPointService;
    @Autowired private EquipmentRepo equipmentRepo;

    @MockBean private com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService redTagAutomationService;
    @MockBean private WorkAreaGitHubPublisher workAreaGitHubPublisher;

    /** Persist an Equipment in its own committed tx (the test is non-transactional). */
    private long givenEquipment(String name) {
        Equipment e = new Equipment();
        e.setName(name);
        return equipmentRepo.saveAndFlush(e).getId();
    }

    /** A create DTO linked to equipment — the production shape that walks getEquipmentDtos in the mapper. */
    private LotoPointIdDto createDto(long id, String tag, long equipmentId) {
        LotoPointIdDto dto = new LotoPointIdDto();
        dto.setId(id);
        dto.setTagNumber(tag);
        dto.setDescription("convert-in-tx IT point");
        dto.setSpecificLocation("loc");
        dto.setEquipmentIdList(List.of(equipmentId));
        return dto;
    }

    @Test
    @DisplayName("OLD path (convert after the service tx returns) throws LazyInitializationException — the production 400")
    void oldPath_convertAfterTx_throwsLazyInit() {
        long eq = givenEquipment("LZ-OLD-EQ");
        LotoPoint saved = lotoPointService.processLotoPoint(createDto(1_000_066_101L, "LZ-OLD", eq));
        // `saved` is DETACHED now (processLotoPoint's tx committed). Mapping walks the lazy `pictures`
        // collection with no open session → LazyInitializationException, exactly as the hub hit.
        assertThatThrownBy(() -> lotoPointService.toDto(saved))
                .isInstanceOf(LazyInitializationException.class)
                .hasMessageContaining("LotoPoint.pictures");
    }

    @Test
    @DisplayName("FIX: processLotoPointToDto converts inside the tx and returns the DTO cleanly")
    void fix_convertInTx_returnsDto() {
        long eq = givenEquipment("LZ-FIX-EQ");
        LotoPointDto dto = lotoPointService.processLotoPointToDto(createDto(1_000_066_102L, "LZ-FIX", eq));
        assertThat(dto).as("converted while the session is open — no LazyInitializationException").isNotNull();
        assertThat(dto.getId()).isEqualTo(1_000_066_102L);
    }
}
