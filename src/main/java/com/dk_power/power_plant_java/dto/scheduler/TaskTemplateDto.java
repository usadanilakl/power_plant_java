package com.dk_power.power_plant_java.dto.scheduler;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskTemplateDto extends BaseDto {
    private String description;
    private String taskType;
    private ValueDto defaultPriority;
    private String stepTemplatesJson;
    private String defaultReferenceTypesJson;
}
