package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.pojo.SwHazards;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPermits;
import com.dk_power.power_plant_java.entities.permits.pojo.SwPpe;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
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
        permits.setVentingPurging(true);
        permits.setJha(true);
        permits.setGasTesting(true);
        permits.setExcavationPermit(true);
        permits.setEnergizedPermit(true);
        dto.setPermits(permits);

        SwPpe ppe = new SwPpe();
        ppe.setHardhat(true);
        ppe.setSafetyGlasses(true);
        ppe.setHearingProtection(true);
        ppe.setBoots(true);
        ppe.setFallProtection(true);
        ppe.setGfi(true);
        ppe.setRespirator(true);
        ppe.setDustMask(true);
        ppe.setGloves(true);
        ppe.setIceCleats(true);
        ppe.setAcidSuit(true);
        ppe.setBarricade(true);
        ppe.setFaceShield(true);
        ppe.setGasMonitor(true);
        ppe.setArcFlashPpe(true);
        ppe.setWeldingJacket(true);
        ppe.setWeldingShield(true);
        ppe.setWeldingGloves(true);
        ppe.setPurgingVentilation(true);
        dto.setPpe(ppe);

        return dto;
    }
}

