package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLockService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class LotoMapper implements BaseMapper{
    private final ModelMapper mapper;
    private final NgLotoPointService lotoPointService;
    private final NgLockService lockService;
    private final NgLotoBoxService lotoBoxService;
    private final NgUserService userService;
    private final NgValueService valueService;
    private final NgEquipmentService equipmentService;
    private final NgLotoService lotoService;

    public LotoMapper(ModelMapper mapper,
                      @Lazy NgLotoPointService lotoPointService,
                      @Lazy NgLockService lockService,
                      @Lazy NgLotoBoxService lotoBoxService,
                      @Lazy NgUserService userService,
                      @Lazy NgValueService valueService,
                      @Lazy NgEquipmentService equipmentService,
                      @Lazy NgLotoService lotoService) {
        this.mapper = mapper;
        this.lotoPointService = lotoPointService;
        this.lockService = lockService;
        this.lotoBoxService = lotoBoxService;
        this.userService = userService;
        this.valueService = valueService;
        this.equipmentService = equipmentService;
        this.lotoService = lotoService;
    }

    @Override
    public ModelMapper getMapper() {
        return mapper;
    }

public LotoDto convertToDto(Loto loto){
    if(loto == null) return null;
    LotoDto dto = new LotoDto();
    if(loto.getId()!=null) dto.setId(loto.getId());
    if(loto.getLotoPoints()!=null && !loto.getLotoPoints().isEmpty()) dto.setLotoPoints(new ArrayList<>(loto.getLotoPoints()));
    if(loto.getLocks()!=null && !loto.getLocks().isEmpty()) dto.setLocks(loto.getLocks().stream().map(lockService::toDto).collect(Collectors.toList()));
    if(loto.getLotoBox()!=null) dto.setLotoBox(lotoBoxService.toDto(loto.getLotoBox()));
    if(loto.getControlAuthority()!=null) dto.setControlAuthority(userService.toDto(loto.getControlAuthority()));
    
    // Adding the rest of the fields
    if(loto.getWorkScope()!=null) dto.setWorkScope(loto.getWorkScope());
    if(loto.getSystem()!=null) dto.setSystem(valueService.valueToDto(loto.getSystem()));
    if(loto.getEquipment()!=null && !loto.getEquipment().isEmpty()) dto.setEquipment(loto.getEquipment().stream().map(equipmentService::toDto).collect(Collectors.toSet()));
    if(loto.getRequestor()!=null) dto.setRequestor(userService.toDto(loto.getRequestor()));
    if(loto.getPermitType()!=null) dto.setPermitType(valueService.valueToDto(loto.getPermitType()));
    if(loto.getDocNum()!=null) dto.setDocNum(loto.getDocNum());
    if(loto.getPermitStatus()!=null) dto.setPermitStatus(valueService.valueToDto(loto.getPermitStatus()));
    if(loto.getTemp()!=null) dto.setTemp(loto.getTemp());
    if(loto.getLotoPoints()!=null) dto.setLotoPoints(new ArrayList(loto.getLotoPoints()));
    if(loto.getSystem()!=null) dto.setEquipmentSystem(loto.getSystem().getName());
    if(loto.getRequestor()!=null) dto.setLotoRequestor(loto.getRequestor().getName());
    if(loto.getDateCreated()!=null) dto.setDate(loto.getDateCreated().toString());



    return dto;
}
public Loto convertToEntity(LotoDto lotoDto) {
    if (lotoDto == null) return null;

    Loto loto = new Loto();
    
    if (lotoDto.getId() != null) loto.setId(lotoDto.getId());
    if (lotoDto.getLotoPoints() != null && !lotoDto.getLotoPoints().isEmpty()) 
        loto.setLotoPoints(new HashSet<>(lotoDto.getLotoPoints()));
    if (lotoDto.getLocks() != null && !lotoDto.getLocks().isEmpty()) 
        loto.setLocks(lotoDto.getLocks().stream().map(lockService::toEntity).collect(Collectors.toList()));
    if (lotoDto.getLotoBox() != null) loto.setLotoBox(lotoBoxService.toEntity(lotoDto.getLotoBox()));
    if (lotoDto.getControlAuthority() != null) loto.setControlAuthority(userService.toEntity(lotoDto.getControlAuthority()));
    
    if (lotoDto.getWorkScope() != null) loto.setWorkScope(lotoDto.getWorkScope());
    if (lotoDto.getSystem() != null) loto.setSystem(valueService.valueToEntity(lotoDto.getSystem()));
    if (lotoDto.getEquipment() != null && !lotoDto.getEquipment().isEmpty()) 
        loto.setEquipment(lotoDto.getEquipment().stream().map(equipmentService::toEntity).collect(Collectors.toSet()));
    if (lotoDto.getRequestor() != null) loto.setRequestor(userService.toEntity(lotoDto.getRequestor()));
    if (lotoDto.getPermitType() != null) loto.setPermitType(valueService.valueToEntity(lotoDto.getPermitType()));
    if (lotoDto.getDocNum() != null) loto.setDocNum(lotoDto.getDocNum());
    if (lotoDto.getPermitStatus() != null) loto.setPermitStatus(valueService.valueToEntity(lotoDto.getPermitStatus()));
    if (lotoDto.getTemp() != null) loto.setTemp(lotoDto.getTemp());
    if (lotoDto.getEquipmentSystem()!= null) loto.setEquipmentSystem(lotoDto.getEquipmentSystem());
    if (lotoDto.getLotoRequestor()!= null) loto.setLotoRequestor(lotoDto.getLotoRequestor());
    if(lotoDto.getDate()!=null) loto.setDate(lotoDto.getDate() );

    
    return loto;
}

public void updateEntityFromDto(LotoDto dto, Loto entity) {
    if (dto == null || entity == null) {
        return;
    }

    // Update basic fields
    if (dto.getId() != null) entity.setId(dto.getId());
    if (dto.getDeleted() != null) entity.setDeleted(dto.getDeleted());
    if (dto.getName() != null) entity.setName(dto.getName());
    if (dto.getNote() != null) entity.setNote(dto.getNote());
    if (dto.getCreatedBy() != null) entity.setCreatedBy(dto.getCreatedBy());
    if (dto.getObjectType() != null) entity.setObjectType(dto.getObjectType());
    if (dto.getDataServiceItemId() != null) entity.setDataServiceItemId(dto.getDataServiceItemId());
    if (dto.getRefactorNotes() != null) entity.setRefactorNotes(dto.getRefactorNotes());
    if (dto.getDateCreated() != null) entity.setDateCreated(dto.getDateCreated());
    if (dto.getDateModified() != null) entity.setDateModified(dto.getDateModified());

    if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
    if (dto.getDocNum() != null) entity.setDocNum(dto.getDocNum());
    if (dto.getTemp() != null) entity.setTemp(dto.getTemp());

    // Update Value entities (assuming these are simple relationships)
    if (dto.getSystem() != null) {
        entity.setSystem(valueService.valueToEntity(dto.getSystem()));
    }
    if (dto.getPermitStatus() != null) {
        entity.setPermitStatus(valueService.valueToEntity(dto.getPermitStatus()));
    }
    if (dto.getPermitType() != null) {
        entity.setPermitType(valueService.valueToEntity(dto.getPermitType()));
    }

    // Update User entities
    if (dto.getRequestor() != null) {
        entity.setRequestor(userService.toEntity(dto.getRequestor()));
    }
    if (dto.getControlAuthority() != null) {
        entity.setControlAuthority(userService.toEntity(dto.getControlAuthority()));
    }

    // Update Equipment set
    if (dto.getEquipment() != null) {
        Set<Equipment> updatedEquipment = dto.getEquipment().stream()
                .map(equipmentService::toEntity)
                .collect(Collectors.toSet());
        entity.setEquipment(updatedEquipment);
    }

    if (dto.getEquipmentSystem()!= null) entity.setEquipmentSystem(dto.getEquipmentSystem());
    if (dto.getLotoRequestor()!= null) entity.setLotoRequestor(dto.getLotoRequestor());
    if(dto.getDate()!=null) entity.setDate(dto.getDate() );


    // Don't update relationships here (LotoBox, Locks, LotoPoints)
    // These are handled separately in the service layer
}

public Loto convertIdDtoToEntity(LotoIdDto lotoDto) {
    if (lotoDto == null) return null;

    Loto loto;
    if(lotoDto.getId() == null || lotoDto.getId() == 0) {
        loto = new Loto();
    }else {
        loto = lotoService.findById(lotoDto.getId()).orElse(new Loto());
    }

    // Set fields from BaseDto
    if (lotoDto.getId() != null && lotoDto.getId()!=0) loto.setId(lotoDto.getId());
    if (lotoDto.getDeleted() != null) loto.setDeleted(lotoDto.getDeleted());
    if (lotoDto.getName() != null) loto.setName(lotoDto.getName());
    if (lotoDto.getNote() != null) loto.setNote(lotoDto.getNote());
    if (lotoDto.getCreatedBy() != null) loto.setCreatedBy(lotoDto.getCreatedBy());
    if (lotoDto.getObjectType() != null) loto.setObjectType(lotoDto.getObjectType());
    if (lotoDto.getDataServiceItemId() != null) loto.setDataServiceItemId(lotoDto.getDataServiceItemId());
    if (lotoDto.getRefactorNotes() != null) loto.setRefactorNotes(lotoDto.getRefactorNotes());
    if (lotoDto.getDateCreated() != null) loto.setDateCreated(lotoDto.getDateCreated());
    if (lotoDto.getDateModified() != null) loto.setDateModified(lotoDto.getDateModified());

    // Set fields from BasePermitIdDto
    if (lotoDto.getWorkScope() != null) loto.setWorkScope(lotoDto.getWorkScope());
    if (lotoDto.getSystem() != null) loto.setSystem(valueService.findById(lotoDto.getSystem()).orElse(null));
    if (lotoDto.getEquipment() != null && !lotoDto.getEquipment().isEmpty()) {
        loto.setEquipment(lotoDto.getEquipment().stream()
                .map(id -> equipmentService.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));
    }
    if (lotoDto.getRequestor() != null) loto.setRequestor(userService.findById(lotoDto.getRequestor()).orElse(null));
    if (lotoDto.getControlAuthority() != null) loto.setControlAuthority(userService.findById(lotoDto.getControlAuthority()).orElse(null));
    if (lotoDto.getPermitType() != null) loto.setPermitType(valueService.findById(lotoDto.getPermitType()).orElse(null));
    if (lotoDto.getDocNum() != null) loto.setDocNum(lotoDto.getDocNum());
    if (lotoDto.getPermitStatus() != null) loto.setPermitStatus(valueService.findById(lotoDto.getPermitStatus()).orElse(null));
    if (lotoDto.getTemp() != null) loto.setTemp(lotoDto.getTemp());

    // Set fields specific to LotoIdDto
    if (lotoDto.getLotoPoints() != null && !lotoDto.getLotoPoints().isEmpty()) {
        loto.setLotoPoints(new HashSet<>(lotoDto.getLotoPoints()
                .stream().map(id -> lotoPointService.findById(id).orElse(null))
                .map(lotoPointService::toIdDto)
                .collect(Collectors.toSet())));
    }
    if (lotoDto.getLocks() != null && !lotoDto.getLocks().isEmpty()) {
        loto.setLocks(lotoDto.getLocks().stream()
                .map(id -> lockService.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));
    }
    if (lotoDto.getLotoBox() != null) loto.setLotoBox(lotoBoxService.findById(lotoDto.getLotoBox()).orElse(null));

    return loto;
}

public void updateLotoFromDto(LotoIdDto dto, Loto loto) {
    if (dto == null || loto == null) {
        return;
    }

    // Update basic fields
    if (dto.getDocNum() != null) {
        loto.setDocNum(dto.getDocNum());
    }
    if (dto.getWorkScope() != null) {
        loto.setWorkScope(dto.getWorkScope());
    }
    if (dto.getTemp() != null) {
        loto.setTemp(dto.getTemp());
    }

    // Update relationships
    if (dto.getSystem() != null) {
        loto.setSystem(valueService.findById(dto.getSystem()).orElse(null));
    }
    if (dto.getPermitStatus() != null) {
        loto.setPermitStatus(valueService.findById(dto.getPermitStatus()).orElse(null));
    }
    if (dto.getPermitType() != null) {
        loto.setPermitType(valueService.findById(dto.getPermitType()).orElse(null));
    }
    if (dto.getRequestor() != null) {
        loto.setRequestor(userService.findById(dto.getRequestor()).orElse(null));
    }
    if (dto.getControlAuthority() != null) {
        loto.setControlAuthority(userService.findById(dto.getControlAuthority()).orElse(null));
    }

    // Update Equipment
    if (dto.getEquipment() != null && !dto.getEquipment().isEmpty()) {
        Set<Equipment> updatedEquipment = dto.getEquipment().stream()
                .map(id -> equipmentService.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        loto.setEquipment(updatedEquipment);
    }

    // Update LotoBox
    if (dto.getLotoBox() != null) {
        loto.setLotoBox(lotoBoxService.findById(dto.getLotoBox()).orElse(null));
    }


    // Don't update lotoPoints here, as it's handled separately in the service
}

public LotoPointIdDto toIdDto(LotoPoint point) {
    if (point == null) {
        return null;
    }

    LotoPointIdDto idDto = new LotoPointIdDto();

    // Set fields from BaseDto
    idDto.setId(point.getId());
    idDto.setDeleted(point.getDeleted());
    idDto.setName(point.getName());
    idDto.setNote(point.getNote());
    idDto.setCreatedBy(point.getCreatedBy());
    idDto.setObjectType(point.getObjectType());
    idDto.setDataServiceItemId(point.getDataServiceItemId());
    idDto.setRefactorNotes(point.getRefactorNotes());
    idDto.setDateCreated(point.getDateCreated());
    idDto.setDateModified(point.getDateModified());

    // Set specific fields from LotoPoint
    idDto.setUnit(point.getUnit());
    idDto.setTagged(point.getTagged());
    idDto.setTagNumber(point.getTagNumber());
    idDto.setDescription(point.getDescription());
    idDto.setIsoPos(point.getIsoPos() != null ? point.getIsoPos().getId() : null);
    idDto.setNormPos(point.getNormPos() != null ? point.getNormPos().getId() : null);
    idDto.setSpecificLocation(point.getSpecificLocation());
    idDto.setStandard(point.getStandard());
    idDto.setGeneralLocation(point.getGeneralLocation());
    idDto.setEquipmentIdList(point.getEquipmentList() != null ? 
        point.getEquipmentList().stream().map(Equipment::getId).collect(Collectors.toList()) : null);
    idDto.setNormalPosition(point.getNormalPosition());
    idDto.setIsolatedPosition(point.getIsolatedPosition());
    idDto.setEquipmentList(point.getEquipmentList() != null ? 
        point.getEquipmentList().stream().map(Equipment::getId).collect(Collectors.toSet()) : null);
    idDto.setOldId(point.getOldId());
    idDto.setObjectType(point.getObjectType());
    idDto.setIsUpdated(point.getIsUpdated());
    idDto.setFileIds(point.getFileIds());
    idDto.setConflictStatus(point.getConflictStatus());
    idDto.setZeroEnergyMethod(point.getZeroEnergyMethod());

    return idDto;
}
}
