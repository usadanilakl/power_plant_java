package com.dk_power.power_plant_java.mappers.browser;

import com.dk_power.power_plant_java.dto.browser.BrFileDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;




@Component
public class BrFileMapper {
    public BrFileDto toDto(FileObject file) {
        if (file == null) {
            return null;
        }

        BrFileDto brFileDto = new BrFileDto();
        brFileDto.setId(file.getId());
        brFileDto.setName(Optional.ofNullable(file.getName()).orElse(""));
        brFileDto.setFileType(Optional.ofNullable(file.getFileType())
                .map(fileType -> fileType.getName())
                .orElse(""));
        brFileDto.setFileLink(Optional.ofNullable(file.getFileLink()).orElse(""));
        brFileDto.setSystem(Optional.ofNullable(file.getSystem())
                .map(system -> system.getName())
                .orElse(""));
        brFileDto.setRelatedSystems(Optional.ofNullable(file.getRelatedSystems()).orElse(""));
        brFileDto.setFileNumber(Optional.ofNullable(file.getFileNumber()).orElse(""));
        brFileDto.setVendor(Optional.ofNullable(file.getVendor())
                .map(vendor -> vendor.getName())
                .orElse(""));
        brFileDto.setPoints(
                Optional.ofNullable(file.getPoints())
                        .map(points -> points.stream()
                                .filter(Objects::nonNull)
                                .map(Equipment::getId)
                                .collect(Collectors.toList()))
                        .orElse(Collections.emptyList())
        );
        brFileDto.setExtensions(Optional.ofNullable(file.getExtensions()).orElse(""));

        return brFileDto;
    }

    public List<BrFileDto> toDtoAll(List<FileObject> all) {
        return all.stream().map(this::toDto).collect(Collectors.toList());
    }
}
