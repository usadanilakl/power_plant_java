package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.sevice.file.FileServiceImpl;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class FileConverter implements Converter<String, FileDto> {
    private final FileServiceImpl fileService;

    public FileConverter(@Lazy FileServiceImpl fileService) {
        this.fileService = fileService;
    }

    @Override
    public FileDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return fileService.getDtoById(Long.parseLong(source),FileDto.class);
    }
}
