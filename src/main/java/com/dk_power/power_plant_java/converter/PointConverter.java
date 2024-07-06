package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.dto.plant.PointDto;
import com.dk_power.power_plant_java.sevice.plant.impl.PointServiceImpl;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class PointConverter implements Converter<String, PointDto> {
    private final PointServiceImpl service;

    public PointConverter(@Lazy PointServiceImpl service) {
        this.service = service;
    }

    @Override
    public PointDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getDtoById(Long.parseLong(source), PointDto.class);
    }
}
