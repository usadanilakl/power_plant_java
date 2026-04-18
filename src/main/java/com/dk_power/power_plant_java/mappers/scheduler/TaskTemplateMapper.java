package com.dk_power.power_plant_java.mappers.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.TaskTemplateDto;
import com.dk_power.power_plant_java.entities.scheduler.TaskTemplate;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TaskTemplateMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }

    public TaskTemplateDto convertToDto(TaskTemplate entity) {
        TaskTemplateDto dto = new TaskTemplateDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setTaskType(entity.getTaskType() != null ? entity.getTaskType().name() : null);
        dto.setStepTemplatesJson(entity.getStepTemplatesJson());
        dto.setDefaultReferenceTypesJson(entity.getDefaultReferenceTypesJson());
        if (entity.getDefaultPriority() != null) {
            var pDto = new com.dk_power.power_plant_java.dto.categories.ValueDto();
            pDto.setId(entity.getDefaultPriority().getId());
            pDto.setName(entity.getDefaultPriority().getName());
            dto.setDefaultPriority(pDto);
        }
        return dto;
    }
}
