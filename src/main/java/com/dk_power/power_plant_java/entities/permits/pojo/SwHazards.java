package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class SwHazards {
    private boolean highTemp;
    private boolean highPressure;
    private boolean energized;
    private boolean storedEnergy;
    private boolean eyeHazard;
    private boolean egressAccess;
    private boolean ergonomicHazard;
    private boolean fallingObject;
    private boolean highNoise;
    private boolean dustParticulate;
    private boolean combustibleDust;
    private boolean fireHazard;
    private boolean hotSurface;
    private boolean slippery;
    private boolean ventilationRequired;
    private boolean lightingRestrictions;
    private boolean chemicalExposure;
    private boolean liftingHazard;
    private boolean handTraps;
    private boolean heatColdStress;
    private boolean elevatedSurface;
    private boolean environmental;
    private boolean weatherHazards;
    private String weatherHazardDescription;
    private boolean other;
    private String otherDescription;
}
