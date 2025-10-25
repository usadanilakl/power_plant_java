package com.dk_power.power_plant_java.entities.permits.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobStep {

    private int sequence;
    private String description;
    private String hazard;
    private String safetyMeasures;


}
