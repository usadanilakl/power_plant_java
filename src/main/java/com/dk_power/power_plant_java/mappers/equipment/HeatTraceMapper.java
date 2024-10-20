package com.dk_power.power_plant_java.mappers.equipment;

import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.FileMapper;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class HeatTraceMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final HtBreakerService htBreakerService;
    private final EquipmentService equipmentService;
    private final HeatTraceService heatTraceService;
    private final FileService fileService;
    private final HtBreakerMapper htBreakerMapper;
    private final FileMapper fileMapper;

    public HeatTraceMapper(ModelMapper modelMapper, @Lazy HtBreakerService htBreakerService, @Lazy EquipmentService equipmentService, @Lazy HeatTraceService heatTraceService, @Lazy FileService fileService, HtBreakerMapper htBreakerMapper, @Lazy FileMapper fileMapper) {
        this.modelMapper = modelMapper;
        this.htBreakerService = htBreakerService;
        this.equipmentService = equipmentService;
        this.heatTraceService = heatTraceService;
        this.fileService = fileService;
        this.htBreakerMapper = htBreakerMapper;
        this.fileMapper = fileMapper;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
    public HeatTraceDto convertToDto(HeatTrace entity){
        if(entity!=null){
            HeatTraceDto dto = new HeatTraceDto();
            if(entity.getId()!=null) dto.setId(entity.getId());
            if(entity.getTagNumber()!=null) dto.setTagNumber(entity.getTagNumber());
            if(entity.getDescription()!=null) dto.setDescription(entity.getDescription());
            if(entity.getBreaker()!=null) dto.setBreaker(htBreakerMapper.convertToDtoLight(entity.getBreaker()));
            if(entity.getName()!=null) dto.setName(entity.getName());
            if(entity.getObjectType()!=null) dto.setObjectType(entity.getObjectType());
            if(entity.getHtIso()!=null) dto.setHtIso(fileService.convertToDto(entity.getHtIso()));
            if(entity.getPid()!=null) dto.setPid(entity.getPid().stream().map(fileMapper::convertToDtoLight).toList());
            if(entity.getEquipmentList()!=null) dto.setEquipmentList(entity.getEquipmentList().stream().map(equipmentService::convertToDto).toList());
            return dto;
        }
        return null;
    }
    public HeatTraceDto convertToDtoLight(HeatTrace entity){
        if(entity!=null){
            HeatTraceDto dto = new HeatTraceDto();
            if(entity.getId()!=null) dto.setId(entity.getId());
            if(entity.getTagNumber()!=null) dto.setTagNumber(entity.getTagNumber());
            if(entity.getDescription()!=null) dto.setDescription(entity.getDescription());
            if(entity.getBreaker()!=null) dto.setBreaker(htBreakerMapper.convertToDtoLight(entity.getBreaker()));
            if(entity.getName()!=null) dto.setName(entity.getName());
            if(entity.getObjectType()!=null) dto.setObjectType(entity.getObjectType());
            if(entity.getHtIso()!=null) dto.setHtIso(fileService.convertToDto(entity.getHtIso()));
            if(entity.getPid()!=null) dto.setPid(entity.getPid().stream().map(fileMapper::convertToDtoLight).toList());
//            if(entity.getEquipmentList()!=null) dto.setEquipmentList(entity.getEquipmentList().stream().map(equipmentService::convertToDto).toList());
            return dto;
        }
        return null;
    }
    public HeatTrace convertToEntity(HeatTraceDto dto){
        if(dto!=null){
            HeatTrace entity = null;
            if(dto.getId()==null) entity = new HeatTrace();
            else entity = heatTraceService.getEntityById(dto.getId());

            if(dto.getId()!=null) entity.setId(dto.getId());
            if(dto.getTagNumber()!=null) entity.setTagNumber(dto.getTagNumber());
            if(dto.getDescription()!=null) entity.setDescription(dto.getDescription());
            if(dto.getBreaker()!=null) entity.setBreaker(htBreakerService.convertToEntity(dto.getBreaker()));
            if(dto.getName()!=null) entity.setName(dto.getName());
            if(dto.getHtIso()!=null) entity.setHtIso(fileService.convertToEntity(dto.getHtIso()));
            if(dto.getPid()!=null) entity.setPid(dto.getPid().stream().map(fileService::convertToEntity).toList());
            if(dto.getEquipmentList()!=null) entity.setEquipmentList(dto.getEquipmentList().stream().map(equipmentService::convertToEntity).toList());

            return entity;
        }
        return null;
    }
}
