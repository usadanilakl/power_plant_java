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
    private String id;
    private String name;
    private String description;
    private String type;
    private String location;
    private String pid;
    private String system;
    private String vendor;
    private Map<String, Integer> originalSize;
    private Map<String, Integer> area;
    private Map<String, String> manuals;
    private String section;
}
