package com.dk_power.power_plant_java.dto.instrumentation;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DuplicateTagGroupDto {
    private String tagNumber;
    private int count;
    private List<String> sharepointIds = new ArrayList<>();
}

