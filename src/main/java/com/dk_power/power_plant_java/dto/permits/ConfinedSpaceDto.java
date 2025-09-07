package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConfinedSpaceDto extends BasePermitDto {

    private String date;
    private String time;
    private String space;
    private String workScope;
    private String issuedTo;
    private String duration;
    private String lotoNum;
    private String hotWorkNum;
    private boolean ventilation;
    private boolean blankFlanged;
    private String meterModel;
    private String meterNum;
    private boolean calibrated;
    private ConfinedSpaceHazards hazards;

    public static ConfinedSpaceDto createTestInstance() {
        ConfinedSpaceDto dto = new ConfinedSpaceDto();

        dto.setDate("09/07/2025");
        dto.setTime("12:34:00");
        dto.setSpace("MVB Basement");
        dto.setWorkScope("Welding Breakers");
        dto.setIssuedTo("Mike Miles");
        dto.setDuration("12 Hours");
        dto.setLotoNum("123456");
        dto.setHotWorkNum("654321");
        dto.setVentilation(false);
        dto.setBlankFlanged(false);
        dto.setMeterModel("RKI GX-3R PRO");
        dto.setMeterNum("4");
        dto.setCalibrated(true);

        ConfinedSpaceHazards hazards = new ConfinedSpaceHazards();

        hazards.setOxygenDeficiency(true);
        hazards.setFlammableGas(true);
        hazards.setCombustibleDust(true);
        hazards.setToxicGas(true);
        hazards.setRotatingEquipment(true);
        hazards.setElectricalShock(true);
        hazards.setEntrapment(true);
        hazards.setEngulfment(true);
        hazards.setHeatStress(true);
        hazards.setFaceShield(true);
        hazards.setGfcI(true);
        hazards.setLowVoltageTools(true);
        hazards.setExplosionProofTools(true);
        hazards.setNonSparkingTools(true);
        hazards.setFallProtection(true);
        hazards.setRetrievalSystem(true);
        hazards.setLifeLine(true);
        hazards.setAtmMeter(true);
        hazards.setTripod(true);

        dto.setHazards(hazards);

        return dto;
    }

}
