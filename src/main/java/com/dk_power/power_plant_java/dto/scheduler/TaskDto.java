package com.dk_power.power_plant_java.dto.scheduler;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.users.UserDto;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class TaskDto extends BaseDto {
    private String description;
    private String notes;
    private String taskLevel;
    private String taskType;

    private String statusName;
    private Long flowId;
    private Long parentTaskId;
    private UserDto assignee;
    private ValueDto priority;
    private LocalDate dueDate;
    private Integer sortOrder;
    private TaskTemplateDto template;

    private String warning;
    private String caution;
    private Boolean requiresSignoff;
    private Integer expectedDurationMinutes;

    private Set<TaskDto> subTasks = new HashSet<>();
    private Set<TaskDto> prerequisites = new HashSet<>();
    private Set<TaskDto> dependents = new HashSet<>();
    private Set<TaskReferenceDto> references = new HashSet<>();
    private Set<FileDto> attachments = new HashSet<>();
}
