package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
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
    private boolean faceShield;
    private boolean gfcI;
    private boolean lowVoltageTools;
    private boolean explosionProofTools;
    private boolean nonSparkingTools;
    private boolean fallProtection;
    private boolean retrievalSystem;
    private boolean lifeLine;
    private boolean atmMeter;
    private boolean tripod;

}
