package com.dk_power.power_plant_java.mappers.browser;

import com.dk_power.power_plant_java.dto.browser.BrEquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class BrEquipmentMapper {

    public BrEquipmentDto toDto(Equipment equipment) {
        if (equipment == null) {
            return null;
        }

        BrEquipmentDto dto = new BrEquipmentDto();

        dto.setTagNumber(Optional.ofNullable(equipment.getTagNumber()).orElse(""));
        dto.setDescription(Optional.ofNullable(equipment.getDescription()).orElse(""));
        dto.setSpecificLocation(Optional.ofNullable(equipment.getSpecificLocation()).orElse(""));
        dto.setEqType(Optional.ofNullable(equipment.getEqType())
                .map(type -> type.getName())
                .orElse(""));
        dto.setFiles(Optional.ofNullable(equipment.getFiles())
                .map(files -> files.stream()
                        .filter(Objects::nonNull)
                        .map(FileObject::getId)
                        .collect(Collectors.toList()))
                .orElse(Collections.emptyList()));
        dto.setVendor(Optional.ofNullable(equipment.getVendor())
                .map(vendor -> vendor.getName())
                .orElse(""));
        dto.setLocation(Optional.ofNullable(equipment.getLocation())
                .map(location -> location.getName())
                .orElse(""));
        dto.setSystem(Optional.ofNullable(equipment.getSystem())
                .map(system -> system.getName())
                .orElse(""));
        dto.setCoordinates(Optional.ofNullable(equipment.getCoordinates()).orElse(""));
        dto.setOriginalPictureSize(Optional.ofNullable(equipment.getOriginalPictureSize()).orElse(""));
        dto.setMainFile(Optional.ofNullable(equipment.getMainFile())
                .map(FileObject::getId)
                .map(String::valueOf)
                .orElse(""));
        dto.setLotoPoints(Optional.ofNullable(equipment.getLotoPoints())
                .map(points -> points.stream()
                        .filter(Objects::nonNull)
                        .map(LotoPoint::getId)
                        .collect(Collectors.toSet()))
                .orElse(Collections.emptySet()));

        return dto;
    }

    public List<BrEquipmentDto> toDtoAll(List<Equipment> all) {
        return all.stream()
                .filter(Objects::nonNull)
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}