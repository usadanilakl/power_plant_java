package com.dk_power.power_plant_java.mappers.equipment;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.stream.Collectors;

@Component
//@RequiredArgsConstructor
public class EquipmentMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final FileService fileService;
    private final EquipmentService equipmentService;
    private final LotoPointService lotoPointService;
    private final HeatTraceService heatTraceService;
    private final HeatTraceMapper heatTraceMapper;
    private final HighlightMapper highlightMapper;

    public EquipmentMapper(ModelMapper modelMapper, @Lazy ValueService valueService, @Lazy FileService fileService, @Lazy EquipmentService equipmentService, @Lazy LotoPointService lotoPointService, @Lazy HeatTraceService heatTraceService, HeatTraceMapper heatTraceMapper, @Lazy HighlightMapper highlightMapper) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.fileService = fileService;
        this.equipmentService = equipmentService;
        this.lotoPointService = lotoPointService;
        this.heatTraceService = heatTraceService;
        this.heatTraceMapper = heatTraceMapper;
        this.highlightMapper = highlightMapper;
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
        if(entity.getHeatTraceList()!=null){
            dto.setHeatTraceList(entity.getHeatTraceList().stream().map(heatTraceMapper::convertToDtoLight).toList());
        }

        if(entity.getHighlight()!=null){
            dto.setHighlight(highlightMapper.convertToDtoLight(entity.getHighlight()));
        }
        return dto;
    }

    public EquipmentDto convertToDtoLight(Equipment entity) {
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

//        if (entity.getCoordinates() != null) {
//            dto.setCoordinates(entity.getCoordinates());
//        }
//
//        if (entity.getOriginalPictureSize() != null) {
//            dto.setOriginalPictureSize(entity.getOriginalPictureSize());
//        }

        if (entity.getObjectType() != null) {
            dto.setObjectType(entity.getObjectType());
        }

//        if (entity.getVendor() != null) {
//            dto.setVendor(valueService.getDtoById(entity.getVendor().getId()));
//        }
//        if (entity.getMainFile() != null) {
//            dto.setMainFile(entity.getMainFile().getFileLink());
//        }
//        if (entity.getLocation() != null) {
//            dto.setLocation(valueService.getDtoById(entity.getLocation().getId()));
//        }
//        if (entity.getEqType() != null) {
//            dto.setEqType(valueService.getDtoById(entity.getEqType().getId()));
//        }
//        if (entity.getSystem() != null) {
//            dto.setSystem(valueService.getDtoById(entity.getSystem().getId()));
//        }
//        if (entity.getFiles() != null) {
//            dto.setFiles(entity.getFiles().stream()
//                    .filter(Objects::nonNull)
//                    .map(FileObject::getFileLink)
//                    .collect(Collectors.toList()));
//        }
//        if(entity.getLotoPoints()!=null){
//            dto.setLotoPoints(entity.getLotoPoints().stream().map(lotoPointService::convertToDto).collect(Collectors.toSet()));
//        }
//        if(entity.getHeatTraceList()!=null){
//            dto.setHeatTraceList(entity.getHeatTraceList().stream().map(heatTraceMapper::convertToDtoLight).toList());
//        }

//        if(entity.getHighlight()!=null){
//            dto.setHighlight(highlightMapper.convertToDtoLight(entity.getHighlight()));
//        }
        return dto;
    }

    public Equipment convertToEntity(EquipmentDto source) {
//        Equipment entity = Optional.of(equipmentService.getEntityById(source.getId())).orElse(new Equipment()) ;
        Equipment entity = null;
        if(source.getId()!=null)entity = equipmentService.getEntityById(source.getId());
        if (entity==null) entity = new Equipment();

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
            if(source.getVendor().getId() == null){
                ValueDto v = valueService.getValueFromCategory("Vendor",source.getVendor().getName());
                if(v==null) throw new RuntimeException("Vendor "+source.getVendor().getName() +" not found");
                else entity.setVendor(valueService.convertToEntity(v));
            }else{
                entity.setVendor(valueService.getEntityById(source.getVendor().getId()));
            }


        }
        if (source.getMainFile() != null) {
            entity.setMainFile(fileService.getByFileLink(source.getMainFile()));
        }
        if (source.getLocation() != null) {
            if(source.getLocation().getId() == null){
                ValueDto v = valueService.getValueFromCategory("Location",source.getLocation().getName());
                if(v==null) throw new RuntimeException("Location "+source.getLocation().getName() +" not found");
                else entity.setLocation(valueService.convertToEntity(v));
            }else{
                entity.setLocation(valueService.getEntityById(source.getLocation().getId()));
            }
            //if(source.getLocation().getId()!=null)entity.setLocation(valueService.getEntityById(source.getLocation().getId()));
        }
        if (source.getEqType() != null) {
            if(source.getEqType().getId() == null){
                ValueDto v = valueService.getValueFromCategory("Equipment Type",source.getEqType().getName());
                if(v==null) throw new RuntimeException("Equipment Type "+source.getEqType().getName() +" not found");
                else entity.setEqType(valueService.convertToEntity(v));
            }else{
                entity.setEqType(valueService.getEntityById(source.getEqType().getId()));
            }
            //if(source.getEqType().getId()!=null)entity.setEqType(valueService.getEntityById(source.getEqType().getId()));
        }
        if (source.getSystem() != null) {

            if(source.getSystem().getId() == null){
                ValueDto v = valueService.getValueFromCategory("System",source.getSystem().getName());
                if(v==null) throw new RuntimeException("System "+source.getSystem().getName() +" not found");
                else entity.setSystem(valueService.convertToEntity(v));
            }else{
                entity.setSystem(valueService.getEntityById(source.getSystem().getId()));
            }
        }
        if (source.getFiles() != null) {
            entity.setFiles(source.getFiles().stream()
                    .filter(Objects::nonNull)
                    .map(fileService::getByFileLink)
                    .collect(Collectors.toList()));
        }

        if(source.getLotoPoints()!=null){
            entity.setLotoPoints(source.getLotoPoints().stream().map(lotoPointService::convertToEntity).collect(Collectors.toSet()));
        }
        if(source.getHeatTraceList()!=null) entity.setHeatTraceList(source.getHeatTraceList().stream().map(heatTraceService::convertToEntity).toList());

        return entity;
    }

@Override
public ModelMapper getMapper() {
return modelMapper;
}
}
