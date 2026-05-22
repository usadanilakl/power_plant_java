package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPermits;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPpe;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.*;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
@NoArgsConstructor
public class SafeWorkDto extends BasePermitDto {

    private String date;
    private String time;
    private String companyPerson;
    private String location;
    private String workScope;
    private String specialInstructions;
    private String requestedBy;

    private SwHazards hazards;
    private SwPermits permits;
    private SwPpe ppe;

    public static SafeWorkDto createTestInstance() {
        SafeWorkDto dto = new SafeWorkDto();

        dto.setDate("09/07/2025");
        dto.setTime("12:00:00");
        dto.setCompanyPerson("Kiewit/Mike Miles");
        dto.setLocation("U2 ACC MCC");
        dto.setWorkScope("Welding Breakers");
        dto.setSpecialInstructions("Weld Safely, do not trip breakers");
        dto.setRequestedBy("Mike Miles");

        SwHazards hazards = new SwHazards();
        hazards.setHighTemp(true);
        hazards.setHighPressure(false);
        hazards.setEnergized(true);
        hazards.setStoredEnergy(false);
        hazards.setEyeHazard(true);
        hazards.setEgressAccess(false);
        hazards.setErgonomicHazard(true);
        hazards.setFallingObject(true);
        hazards.setHighNoise(false);
        hazards.setDustParticulate(true);
        hazards.setCombustibleDust(false);
        hazards.setFireHazard(true);
        hazards.setHotSurface(false);
        hazards.setSlippery(true);
        hazards.setVentilationRequired(true);
        hazards.setLightingRestrictions(false);
        hazards.setChemicalExposure(true);
        hazards.setLiftingHazard(true);
        hazards.setHandTraps(false);
        hazards.setHeatColdStress(true);
        hazards.setElevatedSurface(false);
        hazards.setEnvironmental(false);
        dto.setHazards(hazards);

        SwPermits permits = new SwPermits();
        permits.setLotoRequired(true);
        permits.setConfinedSpace(true);
        permits.setHotWork(true);
        permits.setVentingPurging(false);
        permits.setJha(true);
        permits.setGasTesting(true);
        permits.setExcavationPermit(false);
        permits.setEnergizedPermit(false);
        dto.setPermits(permits);

        SwPpe ppe = new SwPpe();
        ppe.setHardhat(true);
        ppe.setSafetyGlasses(false);
        ppe.setHearingProtection(true);
        ppe.setBoots(true);
        ppe.setFallProtection(false);
        ppe.setGfi(true);
        ppe.setRespiratorDustMask(true);
        ppe.setGloves(true);
        ppe.setAcidSuit(true);
        ppe.setBarricade(false);
        ppe.setFaceShield(true);
        ppe.setGasMonitor(false);
        ppe.setArcFlashPpe(true);
        ppe.setWeldingPpe(true);
        ppe.setPurgingVentilation(true);
        dto.setPpe(ppe);

        return dto;
    }
}

