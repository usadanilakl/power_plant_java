package com.dk_power.power_plant_java.dto.pa;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class PaResponseDto {
    private boolean success;
    private String id;
    private List<Map<String, Object>> data;
    private String message;
}
