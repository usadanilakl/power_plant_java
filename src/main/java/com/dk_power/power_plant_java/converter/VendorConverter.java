package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.dto.plant.SystemDto;
import com.dk_power.power_plant_java.dto.plant.VendorDto;
import com.dk_power.power_plant_java.sevice.plant.impl.SystemServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.VendorServiceImpl;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class VendorConverter implements Converter<String, VendorDto> {
    private final VendorServiceImpl service;

    public VendorConverter(@Lazy VendorServiceImpl service) {
        this.service = service;
    }

    @Override
    public VendorDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getDtoById(Long.parseLong(source), VendorDto.class);
    }
}
