package com.dk_power.power_plant_java.converter.loto;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class PointConverter implements Converter<String, EquipmentDto> {
    private final EquipmentService service;

    public PointConverter(@Lazy EquipmentService service) {
        this.service = service;
    }

    @Override
    public EquipmentDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getDtoById(Long.parseLong(source));
    }
}
