package com.dk_power.power_plant_java.dto.maximo;

import lombok.Data;

/** A Maximo operating location (mxapioperloc) — for the location picker. */
@Data
public class MaximoLocationDto {
    private String href;
    private String location;
    private String description;
    private String type;
    private String status;
    private String siteid;
}
