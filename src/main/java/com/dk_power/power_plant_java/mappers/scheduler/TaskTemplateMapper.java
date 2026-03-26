package com.dk_power.power_plant_java.mappers.scheduler;

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
}
