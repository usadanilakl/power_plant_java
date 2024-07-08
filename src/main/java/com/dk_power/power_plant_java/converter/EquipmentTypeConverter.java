package com.dk_power.power_plant_java.converter;

import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class EquipmentTypeConverter implements Converter<String, EquipmentTypeDto> {
    private final EquipmentTypeServiceImpl service;

    public EquipmentTypeConverter(@Lazy EquipmentTypeServiceImpl service) {
        this.service = service;
    }

    @Override
    public EquipmentTypeDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getDtoById(Long.parseLong(source), EquipmentTypeDto.class);
    }
}
