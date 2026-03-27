package com.dk_power.power_plant_java.dto.scheduler;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class TaskIdDto extends BaseDto {
    private String description;
    private String notes;
    private String taskLevel;
    private String taskType;

    private String statusName;
    private Long flowId;
    private Long parentTaskId;
    private Long assigneeId;
    private Long priorityId;
    private LocalDate dueDate;
    private Integer sortOrder;
    private Long templateId;

    private Set<Long> subTaskIds = new HashSet<>();
    private Set<Long> prerequisiteIds = new HashSet<>();
    private Set<Long> referenceIds = new HashSet<>();
    private Set<Long> attachmentIds = new HashSet<>();
}
