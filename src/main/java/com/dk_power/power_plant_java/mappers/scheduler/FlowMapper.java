package com.dk_power.power_plant_java.mappers.scheduler;

import com.dk_power.power_plant_java.mappers.BaseMapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class FlowMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    public FlowMapper(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
