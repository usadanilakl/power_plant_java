package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.Set;
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
    private final NgLotoService lotoService;

    public LotoPointMapper(ModelMapper modelMapper,
                           @Lazy EquipmentMapper equipmentMapper,
                           LotoMapper lotoMapper,
                           ValueService valueService,
                           @Lazy LotoPointService lotoPointService,
                           @Lazy EquipmentService equipmentService,
                           @Lazy NgLotoService lotoService) {
        this.modelMapper = modelMapper;
        this.equipmentMapper = equipmentMapper;
        this.lotoMapper = lotoMapper;
        this.valueService = valueService;
        this.lotoPointService = lotoPointService;
        this.equipmentService = equipmentService;
        this.lotoService = lotoService;
    }

    public LotoPointDto convertToDto(LotoPoint entity) {
        if (entity == null) {
            return null;
        }
        LotoPointDto dto = new LotoPointDto();
        if(entity.getIsVerified()!= null) dto.setIsVerified(entity.getIsVerified());
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
        if(entity.getConflictStatus()!=null) dto.setConflictStatus(entity.getConflictStatus());

        if(entity.getZeroEnergyMethod()!=null) dto.setZeroEnergyMethod(entity.getZeroEnergyMethod());
        return dto;
    }

    public LotoPoint convertToEntity(LotoPointDto dto) {
        if (dto == null) {
            return null;
        }
        LotoPoint entity = null;
        if(dto.getId()==null || dto.getId()==0) entity = new LotoPoint();
        else entity = lotoPointService.getEntityById(dto.getId());
        if (dto.getIsVerified()!= null) entity.setIsVerified(dto.getIsVerified());
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
        if(dto.getConflictStatus()!=null) entity.setConflictStatus(dto.getConflictStatus());
        if(dto.getZeroEnergyMethod()!=null) entity.setZeroEnergyMethod(dto.getZeroEnergyMethod());
        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }

    public LotoPoint convertIdDtoToEntity(LotoPointIdDto dto) {
        if (dto == null) return null;

        LotoPoint lotoPoint;
        if (dto.getId() == null || dto.getId() == 0) {
            lotoPoint = new LotoPoint();
        } else {
            lotoPoint = lotoPointService.findById(dto.getId()).orElse(new LotoPoint());
        }

        // Set fields from BaseDto
        if(dto.getIsVerified()!= null) lotoPoint.setIsVerified(dto.getIsVerified());
        if (dto.getId() != null && dto.getId() != 0) lotoPoint.setId(dto.getId());
        if (dto.getDeleted() != null) lotoPoint.setDeleted(dto.getDeleted());
        if (dto.getName() != null) lotoPoint.setName(dto.getName());
        if (dto.getNote() != null) lotoPoint.setNote(dto.getNote());
        if (dto.getCreatedBy() != null) lotoPoint.setCreatedBy(dto.getCreatedBy());
        if (dto.getObjectType() != null) lotoPoint.setObjectType(dto.getObjectType());
        if (dto.getDataServiceItemId() != null) lotoPoint.setDataServiceItemId(dto.getDataServiceItemId());
        if (dto.getRefactorNotes() != null) lotoPoint.setRefactorNotes(dto.getRefactorNotes());
        if (dto.getDateCreated() != null) lotoPoint.setDateCreated(dto.getDateCreated());
        if (dto.getDateModified() != null) lotoPoint.setDateModified(dto.getDateModified());

        // Set fields specific to LotoPointIdDto
        if (dto.getUnit() != null) lotoPoint.setUnit(dto.getUnit());
        if (dto.getTagged() != null) lotoPoint.setTagged(dto.getTagged());
        if (dto.getTagNumber() != null) lotoPoint.setTagNumber(dto.getTagNumber());
        if (dto.getDescription() != null) lotoPoint.setDescription(dto.getDescription());
        if (dto.getIsoPos() != null) lotoPoint.setIsoPos(valueService.findById(dto.getIsoPos()).orElse(null));
        if (dto.getNormPos() != null) lotoPoint.setNormPos(valueService.findById(dto.getNormPos()).orElse(null));
        if (dto.getSpecificLocation() != null) lotoPoint.setSpecificLocation(dto.getSpecificLocation());
        if (dto.getStandard() != null) lotoPoint.setStandard(dto.getStandard());
        if (dto.getGeneralLocation() != null) lotoPoint.setGeneralLocation(dto.getGeneralLocation());
        if (dto.getNormalPosition() != null) lotoPoint.setNormalPosition(dto.getNormalPosition());
        if (dto.getIsolatedPosition() != null) lotoPoint.setIsolatedPosition(dto.getIsolatedPosition());
        if (dto.getOldId() != null) lotoPoint.setOldId(dto.getOldId());
        if (dto.getIsUpdated() != null) lotoPoint.setIsUpdated(dto.getIsUpdated());
        if (dto.getFileIds() != null) lotoPoint.setFileIds(dto.getFileIds());
        if (dto.getConflictStatus() != null) lotoPoint.setConflictStatus(dto.getConflictStatus());
        if(dto.getZeroEnergyMethod()!=null) lotoPoint.setZeroEnergyMethod(dto.getZeroEnergyMethod());


        // Handle equipmentList
        if (dto.getEquipmentIdList() != null && !dto.getEquipmentIdList().isEmpty()) {
            Set<Equipment> equipment = dto.getEquipmentIdList().stream()
                    .map(id -> equipmentService.findById(id).orElse(null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            lotoPoint.setEquipmentList(equipment);
        }


        return lotoPoint;
    }

    public LotoPointIdDto toIdDto(LotoPoint lotoPoint) {
        if (lotoPoint == null) return null;

        LotoPointIdDto dto = new LotoPointIdDto();
        dto.setId(lotoPoint.getId());
        dto.setUnit(lotoPoint.getUnit());
        dto.setTagged(lotoPoint.getTagged());
        dto.setTagNumber(lotoPoint.getTagNumber());
        dto.setDescription(lotoPoint.getDescription());
        dto.setIsoPos(lotoPoint.getIsoPos()!= null? lotoPoint.getIsoPos().getId() : null);
        dto.setNormPos(lotoPoint.getNormPos()!= null? lotoPoint.getNormPos().getId() : null);
        dto.setSpecificLocation(lotoPoint.getSpecificLocation());
//        dto.setStandard(lotoPoint.getStandard()!= null? lotoPoint.getStandard().getId() : null);
        dto.setGeneralLocation(lotoPoint.getGeneralLocation());
        dto.setNormalPosition(lotoPoint.getNormalPosition());
        dto.setIsolatedPosition(lotoPoint.getIsolatedPosition());
        dto.setOldId(lotoPoint.getOldId());
        dto.setIsUpdated(lotoPoint.getIsUpdated());
        dto.setFileIds(lotoPoint.getFileIds());
        dto.setConflictStatus(lotoPoint.getConflictStatus());
        dto.setZeroEnergyMethod(lotoPoint.getZeroEnergyMethod());
        dto.setEquipmentList(lotoPoint.getEquipmentList().stream().map(Equipment::getId).collect(Collectors.toSet()));
        dto.setEquipmentIdList(lotoPoint.getEquipmentList().stream().map(Equipment::getId).toList());


        return dto;
    }
}