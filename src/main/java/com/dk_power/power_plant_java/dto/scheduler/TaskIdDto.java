package com.dk_power.power_plant_java.dto.scheduler;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class TaskIdDto extends BaseDto {
    private String description;
    private String completionLog;

    private ValueDto status;
    private Long flow;
    private Long parentTask;

    private Set<Long> subTasks = new HashSet<>();
    private Set<Long> prerequisites = new HashSet<>();
    private Set<Long> dependents = new HashSet<>();

    private Set<Long> references = new HashSet<>();

    private Set<FileDto> fileReferences = new HashSet<>();
    private Set<EquipmentDto> equipmentReferences = new HashSet<>();
    private Set<LotoPointDto> lotoPointReferences = new HashSet<>();
    private Set<ValueDto> locationReferences = new HashSet<>();
}
