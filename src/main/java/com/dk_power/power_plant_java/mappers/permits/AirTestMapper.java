package com.dk_power.power_plant_java.mappers.permits;

import com.dk_power.power_plant_java.mappers.BaseMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

/** Sync-side mapper for {@link com.dk_power.power_plant_java.entities.permits.AirTest}. */
@Component
@RequiredArgsConstructor
public class AirTestMapper implements BaseMapper {
    private final ModelMapper modelMapper;

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}
