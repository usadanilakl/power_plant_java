package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.Data;

@Data
public class ConfinedSpacePrecautions {
    private boolean ventilation;
    private boolean blankFlanged;
    private boolean doubleBlockAndBleed;
    private boolean barriers;
    private boolean other;
    private String otherDescription;
    private String lockOutTagOut;
    private String hotWorkPermit;

}
