package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.mappers.equipment.EquipmentMapper;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgZeroEnergyService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import org.jetbrains.annotations.NotNull;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.*;
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
    private final NgZeroEnergyService zeroEnergyService;

    public LotoPointMapper(ModelMapper modelMapper,
                           @Lazy EquipmentMapper equipmentMapper,
                           LotoMapper lotoMapper,
                           ValueService valueService,
                           @Lazy LotoPointService lotoPointService,
                           @Lazy EquipmentService equipmentService,
                           @Lazy NgLotoService lotoService,
                           NgZeroEnergyService zeroEnergyService) {
        this.modelMapper = modelMapper;
        this.equipmentMapper = equipmentMapper;
        this.lotoMapper = lotoMapper;
        this.valueService = valueService;
        this.lotoPointService = lotoPointService;
        this.equipmentService = equipmentService;
        this.lotoService = lotoService;
        this.zeroEnergyService = zeroEnergyService;
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
        if(entity.getEquipmentList()!=null){
            Set<EquipmentDto> eqList = getEquipmentDtos(entity);
            dto.setEquipmentList(eqList);

            dto.setFileIds(
                    entity.getEquipmentList().stream()
                            .map(e -> {
                                FileObject mainFile = e.getMainFile();
                                return mainFile != null ? mainFile.getId() : null;
                            })
                            .filter(Objects::nonNull)
                            .map(Object::toString)
                            .collect(Collectors.joining(","))
            );

            dto.setEquipmentIds(
                    entity.getEquipmentList().stream()
                            .map(BaseIdEntity::getId)          // Long (or similar)
                            .map(String::valueOf)              // to String
                            .collect(Collectors.joining(","))  // "1,2,3"
            );


        }else{
            dto.setEquipmentIds(entity.getEquipmentIds());
            dto.setFileIds(entity.getFileIds());
        }
//        if(entity.getLotos()!=null) dto.setLotos(entity.getLotos().stream().map(lotoMapper::convertToDto).toList());
        if (entity.getOldId() != null) dto.setOldId(entity.getOldId());
        if(entity.getObjectType()!=null) dto.setObjectType(entity.getObjectType());
        if(entity.getFileIds()!=null) dto.setFileIds(entity.getFileIds());
        if(entity.getConflictStatus()!=null) dto.setConflictStatus(entity.getConflictStatus());

        if(entity.getZeroEnergyMethod()!=null) dto.setZeroEnergyMethod(entity.getZeroEnergyMethod());
        if(entity.getZeroEnergy()!=null) dto.setZeroEnergy(zeroEnergyService.toDto(entity.getZeroEnergy()));
        if(entity.getLocation()!=null) dto.setLocation(valueService.convertToDto(entity.getLocation()));
        if(entity.getEqType()!=null) dto.setEqType(valueService.convertToDto(entity.getEqType()));
        if(entity.getRelatedLotoPointIds()!=null) dto.setRelatedLotoPointIds(entity.getRelatedLotoPointIds());
        if(entity.getCounterpartId()!=null) dto.setCounterpartId(entity.getCounterpartId());
        dto.setObjectType(entity.getObjectType());
        return dto;
    }

    @NotNull
    private static Set<EquipmentDto> getEquipmentDtos(LotoPoint entity) {
        Set<EquipmentDto> eqList = new HashSet<>();
        for (Equipment e : entity.getEquipmentList()) {
            EquipmentDto newEq = new EquipmentDto();

            FileObject file = e.getMainFile();
            FileDto fileDto = new FileDto();

            if(file!=null){
                fileDto.setId(file.getId());
                fileDto.setFileLink(file.getFileLink());
                fileDto.setName(file.getName());
            }

            newEq.setId(e.getId());
            newEq.setCoordinates(e.getCoordinates());
            newEq.setOriginalPictureSize(e.getOriginalPictureSize());
            newEq.setMainFile(fileDto.getFileLink());
            newEq.setMainFileId(fileDto.getId());
            newEq.setMainFileObject(fileDto);

            eqList.add(newEq);
        }
        return eqList;
    }

    public LotoPointDto convertToDto(LotoPointIdDto entity) {
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
        if (entity.getIsoPos() != null) dto.setIsoPos(valueService.convertToDto(valueService.getEntityById(entity.getIsoPos())));
        if (entity.getNormPos() != null) dto.setNormPos(valueService.convertToDto(valueService.getEntityById(entity.getNormPos())));
        if (entity.getSpecificLocation() != null) dto.setSpecificLocation(entity.getSpecificLocation());
        if (entity.getStandard() != null) dto.setStandard(entity.getStandard());
        if (entity.getGeneralLocation() != null) dto.setGeneralLocation(entity.getGeneralLocation());
        if(entity.getEquipmentList()!=null){
            dto.setEquipmentIdList(new ArrayList<>(entity.getEquipmentList()));
            dto.setEquipmentIds(entity.getEquipmentList().stream().map(String::valueOf).collect(Collectors.joining(",")));
        }

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
        if(entity.getZeroEnergyId()!=null) dto.setZeroEnergy(zeroEnergyService.getDtoById(entity.getZeroEnergyId()));
        if(entity.getLocation()!=null) dto.setLocation(valueService.getDtoById(entity.getLocation()));
        if(entity.getEqType()!=null) dto.setEqType(valueService.getDtoById(entity.getEqType()));
        if(entity.getRelatedLotoPointIds()!=null) dto.setRelatedLotoPointIds(entity.getRelatedLotoPointIds());
        if(entity.getCounterpartId()!=null) dto.setCounterpartId(entity.getCounterpartId());
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
        if(dto.getEquipmentIdList()!=null){
            entity.setEquipmentList(dto.getEquipmentIdList().stream().map(equipmentService::getEntityById).collect(Collectors.toSet()));
            entity.setEquipmentIds(dto.getEquipmentIdList().stream().map(String::valueOf).collect(Collectors.joining(",")));
        }
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
        if(dto.getZeroEnergy()!=null && dto.getZeroEnergy().getId()!=null) entity.setZeroEnergy(zeroEnergyService.getEntityById(dto.getZeroEnergy().getId()));
        if(dto.getLocation()!=null) entity.setLocation(valueService.convertToEntity(dto.getLocation()));
        if(dto.getEqType()!=null) entity.setEqType(valueService.convertToEntity(dto.getEqType()));
        if(dto.getRelatedLotoPointIds()!=null) entity.setRelatedLotoPointIds(dto.getRelatedLotoPointIds());
        if(dto.getCounterpartId()!=null) entity.setCounterpartId(dto.getCounterpartId());
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

        // DO NOT set equipmentList here - it's the non-owning side
        // Equipment relationships are managed in processLotoPoint via the owning side (Equipment)

        // Handle ZeroEnergy - if nested object exists, process it; otherwise use ID
        if (dto.getZeroEnergy() != null) {
            // Process the nested ZeroEnergy object
            ZeroEnergy zeroEnergy =
                zeroEnergyService.findOrCreate(dto.getZeroEnergy());
            lotoPoint.setZeroEnergy(zeroEnergy);
        } else if (dto.getZeroEnergyId() != null) {
            System.out.println("Using existing ZeroEnergy by ID: " + dto.getZeroEnergyId());
            // Use existing ZeroEnergy by ID
            lotoPoint.setZeroEnergy(zeroEnergyService.getEntityById(dto.getZeroEnergyId()));
        } else {
            System.out.println("No ZeroEnergy data provided");
        }

        if(dto.getLocation()!=null) lotoPoint.setLocation(valueService.getEntityById(dto.getLocation()));
        if(dto.getEqType()!=null) lotoPoint.setEqType(valueService.getEntityById(dto.getEqType()));
        if(dto.getRelatedLotoPointIds()!=null) lotoPoint.setRelatedLotoPointIds(dto.getRelatedLotoPointIds());
        if(dto.getCounterpartId()!=null) lotoPoint.setCounterpartId(dto.getCounterpartId());
        if(dto.getEquipmentIdList()!=null){
//            lotoPoint.setEquipmentList(dto.getEquipmentIdList().stream().map(equipmentService::getEntityById).collect(Collectors.toSet()));
            lotoPoint.setEquipmentIds(dto.getEquipmentIdList().stream().map(String::valueOf).collect(Collectors.joining(",")));
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

        // Set zeroEnergy - convert to IdDto for full data
        if(lotoPoint.getZeroEnergy()!=null) {
            dto.setZeroEnergyId(lotoPoint.getZeroEnergy().getId());
            dto.setZeroEnergy(zeroEnergyService.toIdDto(lotoPoint.getZeroEnergy()));
        }

        if(lotoPoint.getLocation()!=null) dto.setLocation(lotoPoint.getLocation().getId());
        if(lotoPoint.getEqType()!=null) dto.setEqType(lotoPoint.getEqType().getId());
        if(lotoPoint.getRelatedLotoPointIds()!=null) dto.setRelatedLotoPointIds(lotoPoint.getRelatedLotoPointIds());
        if(lotoPoint.getCounterpartId()!=null) dto.setCounterpartId(lotoPoint.getCounterpartId());

        dto.setObjectType(lotoPoint.getObjectType());



        return dto;
    }

}