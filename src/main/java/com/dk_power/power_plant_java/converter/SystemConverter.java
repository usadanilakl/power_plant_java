package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.dto.plant.SystemDto;
import com.dk_power.power_plant_java.sevice.plant.impl.SystemServiceImpl;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class SystemConverter implements Converter<String, SystemDto> {
    private final SystemServiceImpl service;

    public SystemConverter(@Lazy SystemServiceImpl service) {
        this.service = service;
    }

    @Override
    public SystemDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getDtoById(Long.parseLong(source), SystemDto.class);
    }
}
