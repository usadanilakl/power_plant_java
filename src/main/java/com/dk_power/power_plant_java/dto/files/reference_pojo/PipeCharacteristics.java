package com.dk_power.power_plant_java.dto.files.reference_pojo;

import lombok.Data;

@Data
public class PipeCharacteristics {
    private String diameter;
    private String material;
    private String schedule;
    // ... other pipe-specific fields
    // getters and setters
}