package com.dk_power.power_plant_java.mappers.browser;

import com.dk_power.power_plant_java.dto.browser.BrEquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
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

        dto.setId(equipment.getId());
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
                        .collect(Collectors.toSet()))
                .orElse(Collections.emptySet()));
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
        

        Set<Long> relatedEquipmentIds = new HashSet<>();
        Set<Long> relatedFileIds = new HashSet<>();

        if (equipment.getLotoPoints() != null && !equipment.getLotoPoints().isEmpty()) {
            equipment.getLotoPoints().stream()
                .flatMap(lp -> lp.getEquipmentList().stream())
                .forEach(relatedEquipment -> {
                    relatedEquipmentIds.add(relatedEquipment.getId());
                    Optional.ofNullable(relatedEquipment.getMainFile())
                        .map(FileObject::getId)
                        .ifPresent(relatedFileIds::add);
                });
        }

        if (equipment.getHeatTraceList() != null) {
            equipment.getHeatTraceList().stream()
                .flatMap(ht -> {
                    Set<Long> fileIds = new HashSet<>();

//                    Optional.ofNullable(ht.getPid())
//                        .ifPresent(pid -> fileIds.addAll(
//                            pid.stream()
//                                .filter(Objects::nonNull)
//                                .map(FileObject::getId)
//                                .filter(Objects::nonNull)
//                                .collect(Collectors.toSet())
//                        ));

                    Optional.ofNullable(ht.getHtIso())
                        .map(FileObject::getId)
                        .ifPresent(fileIds::add);

                    Optional.ofNullable(ht.getBreaker())
                        .map(HtBreaker::getPanel)
                        .map(HtPanel::getPanelSchedule)
                        .map(FileObject::getId)
                        .ifPresent(fileIds::add);

                    return fileIds.stream();
                })
                .forEach(relatedFileIds::add);
        }

        dto.setRelatedEquipment(relatedEquipmentIds);
        dto.getFiles().addAll(relatedFileIds);

        return dto;
    }
    

    public List<BrEquipmentDto> toDtoAll(List<Equipment> all) {
        return all.stream()
                .filter(Objects::nonNull)
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}


