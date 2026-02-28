package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class EnergizedWorkChecklist {
    // Section 2 text fields
    private String jobDescription;
    private String safeWorkPractices;
    private String shockHazardAnalysis;
    private String flashProtectionBoundary;
    private String meansToRestrictAccess;

    // Item 3 sub-items (shock hazard boundaries) - text values
    private String limitedApproachBoundary;
    private String restrictedApproachBoundary;
    private String prohibitedApproachBoundary;

    // Item 4 sub-items (flash protection) - text values
    private String incidentEnergy;
    private String arcFlashPpe;
    private String arcFlashBoundary;

    // Section 2 checkboxes
    private boolean jobDescriptionComplete;
    private boolean safeWorkPracticesComplete;
    private boolean shockHazardAnalysisComplete;
    private boolean limitedApproachBoundaryComplete;
    private boolean restrictedApproachBoundaryComplete;
    private boolean prohibitedApproachBoundaryComplete;
    private boolean incidentEnergyComplete;
    private boolean arcFlashPpeComplete;
    private boolean arcFlashBoundaryComplete;
    private boolean meansToRestrictAccessComplete;
    private boolean preJobBriefComplete;
}
