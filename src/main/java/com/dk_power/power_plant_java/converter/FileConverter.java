package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class FileConverter implements Converter<String, FileDto> {
    private final GroupService<FileObject> fileObjectGroupService;

    public FileConverter(GroupService<FileObject> fileObjectGroupService) {
        this.fileObjectGroupService = fileObjectGroupService;
    }

    @Override
    public FileDto convert(String source) {
        return null;
    }
}
