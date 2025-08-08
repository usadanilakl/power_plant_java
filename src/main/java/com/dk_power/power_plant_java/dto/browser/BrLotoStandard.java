package com.dk_power.power_plant_java.dto.browser;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Data;

import java.util.Set;

@Data
public class BrLotoStandard {
    Long id;
    Set<Long> lotoPoints;
    String description;
    String name;
    String note;
}
