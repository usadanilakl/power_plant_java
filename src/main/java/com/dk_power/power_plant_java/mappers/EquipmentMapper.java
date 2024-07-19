package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.stream.Collectors;

@Component
//@RequiredArgsConstructor
public class EquipmentMapper implements BaseMapper{
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final FileService fileService;
    private final EquipmentService equipmentService;
    private final LotoPointService lotoPointService;

    public EquipmentMapper(ModelMapper modelMapper, ValueService valueService, FileService fileService, @Lazy EquipmentService equipmentService, LotoPointService lotoPointService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.fileService = fileService;
        this.equipmentService = equipmentService;
        this.lotoPointService = lotoPointService;
    }


    public EquipmentDto convertToDto(Equipment entity) {
        EquipmentDto dto = new EquipmentDto();
        
        dto.setId(entity.getId());

        if (entity.getName() != null) {
            dto.setName(entity.getName());
        }

        if (entity.getTagNumber() != null) {
            dto.setTagNumber(entity.getTagNumber());
        }

        if (entity.getDescription() != null) {
            dto.setDescription(entity.getDescription());
        }

        if (entity.getSpecificLocation() != null) {
            dto.setSpecificLocation(entity.getSpecificLocation());
        }

        if (entity.getCoordinates() != null) {
            dto.setCoordinates(entity.getCoordinates());
        }

        if (entity.getOriginalPictureSize() != null) {
            dto.setOriginalPictureSize(entity.getOriginalPictureSize());
        }

        if (entity.getObjectType() != null) {
            dto.setObjectType(entity.getObjectType());
        }

        if (entity.getVendor() != null) {
            dto.setVendor(valueService.getDtoById(entity.getVendor().getId()));
        }
        if (entity.getMainFile() != null) {
            dto.setMainFile(entity.getMainFile().getFileLink());
        }
        if (entity.getLocation() != null) {
            dto.setLocation(valueService.getDtoById(entity.getLocation().getId()));
        }
        if (entity.getEqType() != null) {
            dto.setEqType(valueService.getDtoById(entity.getEqType().getId()));
        }
        if (entity.getSystem() != null) {
            dto.setSystem(valueService.getDtoById(entity.getSystem().getId()));
        }
        if (entity.getFiles() != null) {
            dto.setFiles(entity.getFiles().stream()
                    .filter(Objects::nonNull)
                    .map(FileObject::getFileLink)
                    .collect(Collectors.toList()));
        }
        if(entity.getLotoPoints()!=null){
            dto.setLotoPoints(entity.getLotoPoints().stream().map(lotoPointService::convertToDto).collect(Collectors.toSet()));
        }

        return dto;
    }

    public Equipment convertToEntity(EquipmentDto source) {
        Equipment entity = equipmentService.getEntityById(source.getId());

        if (source.getName() != null) {
            entity.setName(source.getName());
        }

        if (source.getTagNumber() != null) {
            entity.setTagNumber(source.getTagNumber());
        }

        if (source.getDescription() != null) {
            entity.setDescription(source.getDescription());
        }

        if (source.getSpecificLocation() != null) {
            entity.setSpecificLocation(source.getSpecificLocation());
        }

        if (source.getCoordinates() != null) {
            entity.setCoordinates(source.getCoordinates());
        }

        if (source.getOriginalPictureSize() != null) {
            entity.setOriginalPictureSize(source.getOriginalPictureSize());
        }

        if (source.getVendor() != null) {
            entity.setVendor(valueService.getEntityById(source.getVendor().getId()));
        }
        if (source.getMainFile() != null) {
            entity.setMainFile(fileService.getByFileLink(source.getMainFile()));
        }
        if (source.getLocation() != null) {
            entity.setLocation(valueService.getEntityById(source.getLocation().getId()));
        }
        if (source.getEqType() != null) {
            entity.setEqType(valueService.getEntityById(source.getEqType().getId()));
        }
        if (source.getSystem() != null) {
            entity.setSystem(valueService.getEntityById(source.getSystem().getId()));
        }
        if (source.getFiles() != null) {
            entity.setFiles(source.getFiles().stream()
                    .filter(Objects::nonNull)
                    .map(fileService::getByFileLink)
                    .collect(Collectors.toList()));
        }

        return entity;
    }

@Override
public ModelMapper getMapper() {
return modelMapper;
}
}
