package com.dk_power.power_plant_java.entities.plant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EqPojo {
    private String label;
    private String eqType;
    private String pid;
    private String vendor;
    private String originalPictureSize;
    private String coordinates;
}
