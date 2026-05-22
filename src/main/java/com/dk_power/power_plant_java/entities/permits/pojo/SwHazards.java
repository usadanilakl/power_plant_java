package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * "Identify Safety Hazards" section of the Safe Work Permit (SW SMP-17).
 *
 * <p>Field set matches the current Red Tag SW form. Existing field names are kept
 * where the hazard still exists (only labels changed on the UI side), so JSON
 * stored on older permits keeps deserializing; {@code @JsonIgnoreProperties}
 * lets genuinely-removed keys be dropped silently.
 *
 * <p>{@code *} = requires Plant Manager approval, {@code **} = requires Energized Electrical WP.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SwHazards {

    // --- Column 1 ---
    private boolean highTemp;                      // *High Temperature (>140F)
    private boolean highPressure;                  // *High Pressure (>100 psi)
    private boolean hazardousFlammablePipingMaint; // *Hazardous or Flammable Piping Maint.  (new)
    private boolean electricalTesting599V;         // *Electrical Testing >599V               (new)
    private boolean energized;                     // **Energized Electrical Work (>50V)
    private boolean storedEnergy;                  // Stored Energy (LOTO)
    private boolean eyeHazard;
    private boolean egressAccess;                  // Egress & Access Hazard
    private boolean ergonomicHazard;

    // --- Column 2 ---
    private boolean fallingObject;                 // Falling Object Hazard
    private boolean highNoise;
    private boolean dustParticulate;               // Dust/Particulate
    private boolean combustibleDust;
    private boolean fireHazard;                    // Fire/Explosion Hazard
    private boolean hotSurface;                    // Hot Surfaces
    private boolean slippery;                      // Slip/Trip/Fall Hazards
    private boolean ventilationRequired;           // Ventilation Req'd (Mech/Natural)
    private boolean lightingRestrictions;          // Lighting/Visibility restrictions
    private boolean exposedRotatingParts;          // Exposed Rotating Parts                  (new)

    // --- Column 3 ---
    private boolean chemicalExposure;              // Possible Chemical Exposure
    private boolean liftingHazard;
    private boolean handTraps;
    private boolean heatColdStress;                // Heat/Cold Stress
    private boolean elevatedSurface;               // Elevated Work Surface
    private boolean environmental;                 // Environmental Concern
    private boolean weatherHazards;
    private String weatherHazardDescription;
    private boolean testingTroubleshooting50V;     // Testing/Troubleshooting >50V            (new)
    private String voltageDescription;             // Voltage text beside Testing/Troubleshooting (new)
    private boolean hexavalentChromium;            // Hexavalent Chromium (Cr VI)             (new)
    private boolean other;
    private String otherDescription;
}
