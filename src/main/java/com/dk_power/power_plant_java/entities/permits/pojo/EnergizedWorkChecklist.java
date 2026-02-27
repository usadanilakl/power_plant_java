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

    // Section 2 checkboxes
    private boolean jobDescriptionComplete;
    private boolean safeWorkPracticesComplete;
    private boolean shockHazardAnalysisComplete;
    private boolean limitedApproachBoundary;
    private boolean restrictedApproachBoundary;
    private boolean prohibitedApproachBoundary;
    private boolean incidentEnergyComplete;
    private boolean arcFlashPpeComplete;
    private boolean arcFlashBoundaryComplete;
    private boolean meansToRestrictAccessComplete;
    private boolean preJobBriefComplete;
}
