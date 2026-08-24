package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConfinedSpaceHazards {
    private boolean oxygenDeficiency;
    private boolean flammableGas;
    private boolean combustibleDust;
    private boolean toxicGas;
    private boolean rotatingEquipment;
    private boolean electricalShock;
    private boolean entrapment;
    private boolean engulfment;
    private boolean heatStress;

    private boolean other;
    private String otherDescription;


}
