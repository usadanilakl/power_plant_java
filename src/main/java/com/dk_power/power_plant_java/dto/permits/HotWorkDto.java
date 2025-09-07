package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.HotWorkMeasures;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class HotWorkDto extends BasePermitDto {
    private String date;
    private String location;
    private String workScope;
    private String forman;
    private String fireWatch;
    private String meterModel;
    private String meterNum;
    private String specialInstructions;
    private HotWorkMeasures measures;

    public static HotWorkDto createTestInstance() {
        HotWorkDto dto = new HotWorkDto();

        dto.setDate("09/07/2025");
        dto.setForman("Mike Miles");
        dto.setFireWatch("Mile Mikes");
        dto.setMeterModel("RKI GX-3R PRO");
        dto.setMeterNum("N");
        dto.setSpecialInstructions("Do not swim in the water down there");
        dto.setLocation("U2 ACC MCC");
        dto.setWorkScope("Welding Breakers");

        HotWorkMeasures measures = new HotWorkMeasures();
        measures.setAreaIsClean(true);
        measures.setFlammablesAreSecured(true);
        measures.setNoCombustibleDustOrDebrisPresent(true);
        measures.setRadiativeHeatPreventiveMeasuresAreTaken(true);
        measures.setVesslsArePurged(true);
        measures.setOpeningsAreCovered(true);
        measures.setDuctVentilationIsSecured(true);
        measures.setLockOutIsCompleted(true);
        measures.setCommunicationIsEstablished(true);
        measures.setFireWatchIsAwareOfDuties(true);
        measures.setFireExtinguisherPresent(true);
        measures.setFireProtectionIsInService(true);

        dto.setMeasures(measures);

        return dto;
    }

}
