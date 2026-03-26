package com.dk_power.power_plant_java.mappers.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.FlowDto;
import com.dk_power.power_plant_java.entities.scheduler.Flow;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class FlowMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;

    public FlowMapper(ModelMapper modelMapper, @Lazy ValueService valueService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
    }

    public FlowDto convertToDto(Flow flow) {
        FlowDto dto = new FlowDto();
        dto.setId(flow.getId());
        dto.setName(flow.getName());
        dto.setDescription(flow.getDescription());
        dto.setDateCreated(flow.getDateCreated());
        dto.setDateModified(flow.getDateModified());
        if (flow.getStatus() != null) dto.setStatus(valueService.convertToDto(flow.getStatus()));
        // Deliberately skip tasks — loaded separately via NgTaskService.getTasksByFlowId
        return dto;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
