package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.dto.plant.files.FileTypeDto;
import com.dk_power.power_plant_java.sevice.plant.impl.FileTypeServiceImpl;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class FileTypeConverter implements Converter<String, FileTypeDto> {
    private final FileTypeServiceImpl service;

    public FileTypeConverter(@Lazy FileTypeServiceImpl service) {
        this.service = service;
    }

    @Override
    public FileTypeDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getDtoById(Long.parseLong(source), FileTypeDto.class);
//        return service.getDtoByName(source);
    }
}
