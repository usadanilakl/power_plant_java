package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class ConfinedSpacePpe {
    private boolean faceShield;
    private boolean fcfi;
    private boolean lovVoltageTools;
    private boolean explosionProofTools;
    private boolean nonSparkingTools;
    private boolean fallProtection;
    private boolean retrievalSystem;
    private boolean lifeline;
    private boolean personalAtmosphericMeter;
    private boolean tripod;
    private boolean other;
    private String otherDescription;

}
