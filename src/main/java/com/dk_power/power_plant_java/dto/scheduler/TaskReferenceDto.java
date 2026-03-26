package com.dk_power.power_plant_java.dto.scheduler;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskReferenceDto extends BaseDto {
    private String referenceType;
    private Long referenceId;
    private Long taskId;
}
