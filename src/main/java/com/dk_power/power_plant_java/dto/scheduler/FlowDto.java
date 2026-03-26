package com.dk_power.power_plant_java.dto.scheduler;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class FlowDto extends BaseDto {
    private String description;
    private ValueDto status;
    private FlowTemplateDto template;
    private Set<TaskDto> tasks = new HashSet<>();
}
