package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * "Work Type" checkbox group added by the 2026-08-27 Hot Work Permit revision.
 * "griding" reproduces the spelling printed on the controlled form.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HotWorkType {
    private boolean welding;
    private boolean griding;
    private boolean cutting;
    private boolean brazing;
    private boolean other;
    private String otherDescription;
}
