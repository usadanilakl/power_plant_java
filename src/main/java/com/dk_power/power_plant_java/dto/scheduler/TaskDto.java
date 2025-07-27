package com.dk_power.power_plant_java.dto.scheduler;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class TaskDto {
    private Long id;
    private String name;
    private String description;
    private String completionLog;

    private ValueDto status;
    private FlowDto flow;
    private TaskDto parentTask;

    private Set<TaskDto> subTasks = new HashSet<>();

    private Set<TaskDto> prerequisites = new HashSet<>();
    private Set<TaskDto> dependents = new HashSet<>();

    private Set<TaskReferenceDto> references = new HashSet<>();

    private Set<FileDto> fileReferences = new HashSet<>();
    private Set<EquipmentDto> equipmentReferences = new HashSet<>();
    private Set<LotoPointDto> lotoPointReferences = new HashSet<>();
    private Set<ValueDto> locationReferences = new HashSet<>();
}