package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.dto.plant.LocationDto;
import com.dk_power.power_plant_java.sevice.plant.impl.LocationServiceImpl;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class LocationConverter implements Converter<String, LocationDto> {
    private final LocationServiceImpl service;

    public LocationConverter(@Lazy LocationServiceImpl service) {
        this.service = service;
    }

    @Override
    public LocationDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getDtoById(Long.parseLong(source), LocationDto.class);
    }
}
