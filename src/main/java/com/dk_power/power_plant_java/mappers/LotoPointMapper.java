package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.LotoPointDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
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

    public LotoPointMapper(ModelMapper modelMapper, @Lazy EquipmentMapper equipmentMapper, LotoMapper lotoMapper) {
        this.modelMapper = modelMapper;
        this.equipmentMapper = equipmentMapper;
        this.lotoMapper = lotoMapper;
    }

    public LotoPointDto convertToDto(LotoPoint entity) {
        if (entity == null) {
            return null;
        }
        LotoPointDto dto = new LotoPointDto();
        if (entity.getUnit() != null) dto.setUnit(entity.getUnit());
        if (entity.getTagged() != null) dto.setTagged(entity.getTagged());
        if (entity.getTagNumber() != null) dto.setTagNumber(entity.getTagNumber());
        if (entity.getDescription() != null) dto.setDescription(entity.getDescription());
        if (entity.getLocation() != null) dto.setLocation(entity.getLocation());
        if (entity.getStandard() != null) dto.setStandard(entity.getStandard());
        if (entity.getGeneralLocation() != null) dto.setGeneralLocation(entity.getGeneralLocation());
        if (entity.getEquipment() != null) dto.setEquipment(entity.getEquipment());
        if (entity.getExtraInfo() != null) dto.setExtraInfo(entity.getExtraInfo());
        if (entity.getType() != null) dto.setType(entity.getType());
        if (entity.getSystem() != null) dto.setSystem(entity.getSystem());
        if (entity.getNormalPosition() != null) dto.setNormalPosition(entity.getNormalPosition());
        if (entity.getIsolatedPosition() != null) dto.setIsolatedPosition(entity.getIsolatedPosition());
        if (entity.getFluid() != null) dto.setFluid(entity.getFluid());
        if (entity.getSize() != null) dto.setSize(entity.getSize());
        if (entity.getElectricalCheckStatus() != null) dto.setElectricalCheckStatus(entity.getElectricalCheckStatus());
        if (entity.getRedTagId() != null) dto.setRedTagId(entity.getRedTagId());
        if (entity.getInUse() != null) dto.setInUse(entity.getInUse());
        //if(entity.getEquipmentList()!=null) dto.setEquipmentList(entity.getEquipmentList().stream().map(equipmentMapper::convertToDto).collect(Collectors.toSet()));
        if(entity.getLotos()!=null) dto.setLotos(entity.getLotos().stream().map(lotoMapper::convertToDto).toList());
        if (entity.getOldId() != null) dto.setOldId(entity.getOldId());
        if(entity.getObjectType()!=null) dto.setObjectType(entity.getObjectType());
        return dto;
    }

    public LotoPoint convertToEntity(LotoPointDto dto) {
        if (dto == null) {
            return null;
        }
        LotoPoint entity = new LotoPoint();
        if (dto.getUnit() != null) entity.setUnit(dto.getUnit());
        if (dto.getTagged() != null) entity.setTagged(dto.getTagged());
        if (dto.getTagNumber() != null) entity.setTagNumber(dto.getTagNumber());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getLocation() != null) entity.setLocation(dto.getLocation());
        if (dto.getStandard() != null) entity.setStandard(dto.getStandard());
        if (dto.getGeneralLocation() != null) entity.setGeneralLocation(dto.getGeneralLocation());
        if (dto.getEquipment() != null) entity.setEquipment(dto.getEquipment());
        if (dto.getExtraInfo() != null) entity.setExtraInfo(dto.getExtraInfo());
        if (dto.getType() != null) entity.setType(dto.getType());
        if (dto.getSystem() != null) entity.setSystem(dto.getSystem());
        if (dto.getNormalPosition() != null) entity.setNormalPosition(dto.getNormalPosition());
        if (dto.getIsolatedPosition() != null) entity.setIsolatedPosition(dto.getIsolatedPosition());
        if (dto.getFluid() != null) entity.setFluid(dto.getFluid());
        if (dto.getSize() != null) entity.setSize(dto.getSize());
        if (dto.getElectricalCheckStatus() != null) entity.setElectricalCheckStatus(dto.getElectricalCheckStatus());
        if (dto.getRedTagId() != null) entity.setRedTagId(dto.getRedTagId());
        if (dto.getInUse() != null) entity.setInUse(dto.getInUse());
        //if(dto.getEquipmentList()!=null) entity.setEquipmentList(dto.getEquipmentList().stream().map(equipmentMapper::convertToEntity).collect(Collectors.toSet()));
        if(dto.getLotos()!=null) entity.setLotos(dto.getLotos().stream().map(lotoMapper::convertToEntity).toList());
        if (dto.getOldId() != null) entity.setOldId(dto.getOldId());
        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}