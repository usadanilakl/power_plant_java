package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
//@RequiredArgsConstructor
public class LotoPointMapper implements BaseMapper{
    private final ModelMapper modelMapper;
    private final EquipmentMapper equipmentMapper;
    private final LotoMapper lotoMapper;
    private final ValueService valueService;
    private final LotoPointService lotoPointService;
    private final EquipmentService equipmentService;

    public LotoPointMapper(ModelMapper modelMapper, @Lazy EquipmentMapper equipmentMapper, LotoMapper lotoMapper, ValueService valueService, @Lazy LotoPointService lotoPointService, @Lazy EquipmentService equipmentService) {
        this.modelMapper = modelMapper;
        this.equipmentMapper = equipmentMapper;
        this.lotoMapper = lotoMapper;
        this.valueService = valueService;
        this.lotoPointService = lotoPointService;
        this.equipmentService = equipmentService;
    }

    public LotoPointDto convertToDto(LotoPoint entity) {
        if (entity == null) {
            return null;
        }
        LotoPointDto dto = new LotoPointDto();
        if (entity.getUnit() != null) dto.setUnit(entity.getUnit());
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getIsUpdated() != null) dto.setIsUpdated(entity.getIsUpdated());
        if (entity.getTagged() != null) dto.setTagged(entity.getTagged());
        if (entity.getTagNumber() != null) dto.setTagNumber(entity.getTagNumber());
        if (entity.getDescription() != null) dto.setDescription(entity.getDescription());
        if (entity.getIsoPos() != null) dto.setIsoPos(valueService.convertToDto(entity.getIsoPos()));
        if (entity.getNormPos() != null) dto.setNormPos(valueService.convertToDto(entity.getNormPos()));
        if (entity.getSpecificLocation() != null) dto.setSpecificLocation(entity.getSpecificLocation());
        if (entity.getStandard() != null) dto.setStandard(entity.getStandard());
        if (entity.getGeneralLocation() != null) dto.setGeneralLocation(entity.getGeneralLocation());
        if(entity.getEquipmentList()!=null) dto.setEquipmentIdList(entity.getEquipmentList().stream().map(BaseIdEntity::getId).toList());
//        if (entity.getEquipment() != null) dto.setEquipment(entity.getEquipment());
//        if (entity.getExtraInfo() != null) dto.setExtraInfo(entity.getExtraInfo());
//        if (entity.getType() != null) dto.setType(entity.getType());
//        if (entity.getSystem() != null) dto.setSystem(entity.getSystem());
        if (entity.getNormalPosition() != null) dto.setNormalPosition(entity.getNormalPosition());
        if (entity.getIsolatedPosition() != null) dto.setIsolatedPosition(entity.getIsolatedPosition());
//        if (entity.getFluid() != null) dto.setFluid(entity.getFluid());
//        if (entity.getSize() != null) dto.setSize(entity.getSize());
//        if (entity.getElectricalCheckStatus() != null) dto.setElectricalCheckStatus(entity.getElectricalCheckStatus());
//        if (entity.getRedTagId() != null) dto.setRedTagId(entity.getRedTagId());
//        if (entity.getInUse() != null) dto.setInUse(entity.getInUse());
        //if(entity.getEquipmentList()!=null) dto.setEquipmentList(entity.getEquipmentList().stream().map(equipmentMapper::convertToDto).collect(Collectors.toSet()));
//        if(entity.getLotos()!=null) dto.setLotos(entity.getLotos().stream().map(lotoMapper::convertToDto).toList());
        if (entity.getOldId() != null) dto.setOldId(entity.getOldId());
        if(entity.getObjectType()!=null) dto.setObjectType(entity.getObjectType());
        if(entity.getFileIds()!=null) dto.setFileIds(entity.getFileIds());
        return dto;
    }

    public LotoPoint convertToEntity(LotoPointDto dto) {
        if (dto == null) {
            return null;
        }
        LotoPoint entity = null;
        if(dto.getId()==null) entity = new LotoPoint();
        else entity = lotoPointService.getEntityById(dto.getId());
        if (dto.getUnit() != null) entity.setUnit(dto.getUnit());
        if (dto.getTagged() != null) entity.setTagged(dto.getTagged());
        if (dto.getTagNumber() != null) entity.setTagNumber(dto.getTagNumber());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getIsoPos() != null) entity.setIsoPos(valueService.convertToEntity(dto.getIsoPos()));
        if (dto.getNormPos() != null) entity.setNormPos(valueService.convertToEntity(dto.getNormPos()));
        if (dto.getSpecificLocation() != null) entity.setSpecificLocation(dto.getSpecificLocation());
        if (dto.getStandard() != null) entity.setStandard(dto.getStandard());
        if (dto.getGeneralLocation() != null) entity.setGeneralLocation(dto.getGeneralLocation());
        if(dto.getEquipmentIdList()!=null) entity.setEquipmentList(dto.getEquipmentIdList().stream().map(equipmentService::getEntityById).collect(Collectors.toSet()));
//        if (dto.getEquipment() != null) entity.setEquipment(dto.getEquipment());
//        if (dto.getExtraInfo() != null) entity.setExtraInfo(dto.getExtraInfo());
//        if (dto.getType() != null) entity.setType(dto.getType());
//        if (dto.getSystem() != null) entity.setSystem(dto.getSystem());
        if (dto.getNormalPosition() != null) entity.setNormalPosition(dto.getNormalPosition());
        if (dto.getIsolatedPosition() != null) entity.setIsolatedPosition(dto.getIsolatedPosition());
//        if (dto.getFluid() != null) entity.setFluid(dto.getFluid());
//        if (dto.getSize() != null) entity.setSize(dto.getSize());
//        if (dto.getElectricalCheckStatus() != null) entity.setElectricalCheckStatus(dto.getElectricalCheckStatus());
//        if (dto.getRedTagId() != null) entity.setRedTagId(dto.getRedTagId());
//        if (dto.getInUse() != null) entity.setInUse(dto.getInUse());
        //if(dto.getEquipmentList()!=null) entity.setEquipmentList(dto.getEquipmentList().stream().map(equipmentMapper::convertToEntity).collect(Collectors.toSet()));
//        if(dto.getLotos()!=null) entity.setLotos(dto.getLotos().stream().map(lotoMapper::convertToEntity).toList());
        if (dto.getOldId() != null) entity.setOldId(dto.getOldId());
        if (dto.getIsUpdated() != null) entity.setIsUpdated(dto.getIsUpdated());
        if(dto.getFileIds()!=null) entity.setFileIds(dto.getFileIds());
        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}