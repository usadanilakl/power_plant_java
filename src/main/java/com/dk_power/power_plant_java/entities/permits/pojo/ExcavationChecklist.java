package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class ExcavationChecklist {
    // 1. General Information
    private String lessThan4Ft;
    private String caveInPotential;
    private String deeperThan4Ft;
    private String slopingUsed;

    // 2. Inspection of Jobsite
    private String dailyInspection;
    private String competentPersonAuthority;
    private String surfaceEncumbrances;
    private String looseRockProtection;
    private String hardHats;
    private String spoilsSetBack;
    private String adequateBarriers;
    private String standAwayFromVehicles;
    private String warningSystem;
    private String noSuspendedLoads;

    // 3. Utilities
    private String utilitiesMarked;
    private String handDigging;
    private String utilitiesProtected;

    // 4. Means of Access and Egress
    private String egressDistance;
    private String laddersExtend;

    // 5. Wet Conditions
    private String precautionsForWater;
    private String diversionDitches;
    private String inspectionAfterRain;

    // 6. Hazardous Atmosphere
    private String atmosphereTested;
    private String oxygenDeficiency;
    private String lowOxygen;
    private String combustibleGas;
    private String emergencyEquipment;
    private String ventilationProvided;
    private String attendantProvided;
    private String atmosphericMonitoring;
    private String safetyEquipment;
    private String evacuationWarning;

    // 7. Support Systems
    private String supportSystemDesigned;
    private String materialsGoodCondition;
    private String membersSecured;
    private String timberedExcavations;
    private String backfillProgression;
    private String removalFromBottom;
}
