package com.dk_power.power_plant_java.dto.scheduler;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskReferenceDto {
    private Long id;
    private String referenceType;
    private Long referenceId;
    private TaskDto actionStep;
}