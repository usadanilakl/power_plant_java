package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceHazards;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
@NoArgsConstructor
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

        hazards.setOxygenDeficiency(false);
        hazards.setFlammableGas(true);
        hazards.setCombustibleDust(false);
        hazards.setToxicGas(false);
        hazards.setRotatingEquipment(true);
        hazards.setElectricalShock(true);
        hazards.setEntrapment(true);
        hazards.setEngulfment(false);
        hazards.setHeatStress(true);
        hazards.setFaceShield(false);
        hazards.setGfcI(true);
        hazards.setLowVoltageTools(false);
        hazards.setExplosionProofTools(true);
        hazards.setNonSparkingTools(false);
        hazards.setFallProtection(true);
        hazards.setRetrievalSystem(true);
        hazards.setLifeLine(false);
        hazards.setAtmMeter(true);
        hazards.setTripod(true);

        dto.setHazards(hazards);

        return dto;
    }

}
