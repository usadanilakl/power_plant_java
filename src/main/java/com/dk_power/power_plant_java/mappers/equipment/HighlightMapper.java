package com.dk_power.power_plant_java.mappers.equipment;

import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HighlightService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
//@RequiredArgsConstructor
public class HighlightMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final FileService fileService;
    private final EquipmentService equipmentService;
    private final HighlightService highlightService;

    public HighlightMapper(ModelMapper modelMapper, @Lazy FileService fileService, @Lazy EquipmentService equipmentService, @Lazy HighlightService highlightService) {
        this.modelMapper = modelMapper;
        this.fileService = fileService;
        this.equipmentService = equipmentService;
        this.highlightService = highlightService;
    }


    public HighlightDto convertToDto(Highlight entity) {
        HighlightDto dto = new HighlightDto();
        
        dto.setId(entity.getId());

        if (entity.getName() != null) {
            dto.setName(entity.getName());
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

        if(entity.getFile()!=null){
            dto.setFile(fileService.convertToDto(entity.getFile()));
        }

        if(entity.getEquipmentList()!=null){
            dto.setEquipmentList(entity.getEquipmentList().stream().map(equipmentService::convertToDto).toList());
        }

        if(entity.getStartX()!=null){
            dto.setStartX(entity.getStartX());
        }

        if(entity.getStartY()!=null){
            dto.setStartY(entity.getStartY());
        }

        if(entity.getEndX()!=null){
            dto.setEndX(entity.getEndX());
        }

        if(entity.getEndY()!=null){
            dto.setEndY(entity.getEndY());
        }

        if(entity.getWidth()!=null){
            dto.setWidth(entity.getWidth());
        }

        if(entity.getHeight()!=null){
            dto.setHeight(entity.getHeight());
        }

        return dto;
    }

    public HighlightDto convertToDtoLight(Highlight entity) {
        HighlightDto dto = new HighlightDto();

        dto.setId(entity.getId());

        if (entity.getName() != null) {
            dto.setName(entity.getName());
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

//        if(entity.getFile()!=null){
//            dto.setFile(fileService.convertToDto(entity.getFile()));
//        }

//        if(entity.getEquipmentList()!=null){
//            dto.setEquipmentList(entity.getEquipmentList().stream().map(equipmentService::convertToDto).toList());
//        }

        if(entity.getStartX()!=null){
            dto.setStartX(entity.getStartX());
        }

        if(entity.getStartY()!=null){
            dto.setStartY(entity.getStartY());
        }

        if(entity.getEndX()!=null){
            dto.setEndX(entity.getEndX());
        }

        if(entity.getEndY()!=null){
            dto.setEndY(entity.getEndY());
        }

        if(entity.getWidth()!=null){
            dto.setWidth(entity.getWidth());
        }

        if(entity.getHeight()!=null){
            dto.setHeight(entity.getHeight());
        }

        if(entity.getPictureHeight()!=null){
            dto.setPictureHeight(entity.getPictureHeight());
        }

        if(entity.getPictureWidth()!=null){
            dto.setPictureWidth(entity.getPictureWidth());
        }

        return dto;
    }

    public Highlight convertToEntity(HighlightDto source) {

        Highlight entity = null;
        if(source.getId()!=null)entity = highlightService.getEntityById(source.getId());
        if (entity==null) entity = new Highlight();

        if (source.getName() != null) {
            entity.setName(source.getName());
        }

        if (source.getCoordinates() != null) {
            entity.setCoordinates(source.getCoordinates());
        }

        if (source.getOriginalPictureSize() != null) {
            entity.setOriginalPictureSize(source.getOriginalPictureSize());
        }

        if (source.getObjectType() != null) {
            entity.setObjectType(source.getObjectType());
        }

        if(source.getFile()!=null){
            entity.setFile(fileService.convertToEntity(source.getFile()));
        }

        if(source.getEquipmentList()!=null){
            entity.setEquipmentList(source.getEquipmentList().stream().map(equipmentService::convertToEntity).toList());
        }

        if(source.getStartX()!=null){
            entity.setStartX(source.getStartX());
        }

        if(source.getStartY()!=null){
            entity.setStartY(source.getStartY());
        }

        if(source.getEndX()!=null){
            entity.setEndX(source.getEndX());
        }

        if(source.getEndY()!=null){
            entity.setEndY(source.getEndY());
        }

        if(source.getWidth()!=null){
            entity.setWidth(source.getWidth());
        }

        if(source.getHeight()!=null){
            entity.setHeight(source.getHeight());
        }
        return entity;
    }

@Override
public ModelMapper getMapper() {
return modelMapper;
}
}
