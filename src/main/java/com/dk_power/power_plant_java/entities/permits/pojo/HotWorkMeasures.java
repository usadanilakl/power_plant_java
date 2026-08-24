package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HotWorkMeasures {
    private boolean areaIsClean;
    private boolean flammablesAreSecured;
    private boolean noCombustibleDustOrDebrisPresent;
    private boolean radiativeHeatPreventiveMeasuresAreTaken;
    private boolean vesselsArePurged;
    private boolean openingsAreCovered;
    private boolean ductVentilationIsSecured;
    private boolean lockOutIsCompleted;
    private boolean communicationIsEstablished;
    private boolean fireWatchIsAwareOfDuties;
    private boolean fireExtinguisherPresent;
    private boolean fireProtectionIsInService;

}
