package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLockService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class LotoMapper implements BaseMapper{
    private final ModelMapper mapper;
    private final NgLotoPointService lotoPointService;
    private final NgLockService lockService;
    private final NgLotoBoxService lotoBoxService;
    private final NgUserService userService;
    private final NgValueService valueService;
    private final EquipmentService equipmentService;

    public LotoMapper(ModelMapper mapper,
                      @Lazy NgLotoPointService lotoPointService,
                      @Lazy NgLockService lockService,
                      @Lazy NgLotoBoxService lotoBoxService,
                      @Lazy NgUserService userService,
                      @Lazy NgValueService valueService,
                      @Lazy EquipmentService equipmentService) {
        this.mapper = mapper;
        this.lotoPointService = lotoPointService;
        this.lockService = lockService;
        this.lotoBoxService = lotoBoxService;
        this.userService = userService;
        this.valueService = valueService;
        this.equipmentService = equipmentService;
    }

    @Override
    public ModelMapper getMapper() {
        return mapper;
    }

public LotoDto convertToDto(Loto loto){
    if(loto == null) return null;
    LotoDto dto = new LotoDto();
    if(loto.getId()!=null) dto.setId(loto.getId());
    if(loto.getLotoPoints()!=null && !loto.getLotoPoints().isEmpty()) dto.setLotoPoints(loto.getLotoPoints().stream().map(lotoPointService::toDto).collect(Collectors.toList()));
    if(loto.getLocks()!=null && !loto.getLocks().isEmpty()) dto.setLocks(loto.getLocks().stream().map(lockService::toDto).collect(Collectors.toList()));
    if(loto.getLotoBox()!=null) dto.setBox(lotoBoxService.toDto(loto.getLotoBox()));
    if(loto.getControlAuthority()!=null) dto.setControlAuthority(userService.toDto(loto.getControlAuthority()));
    
    // Adding the rest of the fields
    if(loto.getWorkScope()!=null) dto.setWorkScope(loto.getWorkScope());
    if(loto.getSystem()!=null) dto.setSystem(valueService.valueToDto(loto.getSystem()));
    if(loto.getEquipment()!=null && !loto.getEquipment().isEmpty()) dto.setEquipment(loto.getEquipment().stream().map(equipmentService::convertToDto).collect(Collectors.toSet()));
    if(loto.getRequestor()!=null) dto.setRequestor(userService.toDto(loto.getRequestor()));
    if(loto.getPermitType()!=null) dto.setPermitType(valueService.valueToDto(loto.getPermitType()));
    if(loto.getDocNum()!=null) dto.setDocNum(loto.getDocNum());
    if(loto.getPermitStatus()!=null) dto.setPermitStatus(valueService.valueToDto(loto.getPermitStatus()));
    if(loto.getTemp()!=null) dto.setTemp(loto.getTemp());
    
    return dto;
}
public Loto convertToEntity(LotoDto lotoDto) {
    if (lotoDto == null) return null;

    Loto loto = new Loto();
    
    if (lotoDto.getId() != null) loto.setId(lotoDto.getId());
    if (lotoDto.getLotoPoints() != null && !lotoDto.getLotoPoints().isEmpty()) 
        loto.setLotoPoints(lotoDto.getLotoPoints().stream().map(lotoPointService::toEntity).collect(Collectors.toList()));
    if (lotoDto.getLocks() != null && !lotoDto.getLocks().isEmpty()) 
        loto.setLocks(lotoDto.getLocks().stream().map(lockService::toEntity).collect(Collectors.toList()));
    if (lotoDto.getBox() != null) loto.setLotoBox(lotoBoxService.toEntity(lotoDto.getBox()));
    if (lotoDto.getControlAuthority() != null) loto.setControlAuthority(userService.toEntity(lotoDto.getControlAuthority()));
    
    if (lotoDto.getWorkScope() != null) loto.setWorkScope(lotoDto.getWorkScope());
    if (lotoDto.getSystem() != null) loto.setSystem(valueService.valueToEntity(lotoDto.getSystem()));
    if (lotoDto.getEquipment() != null && !lotoDto.getEquipment().isEmpty()) 
        loto.setEquipment(lotoDto.getEquipment().stream().map(equipmentService::convertToEntity).collect(Collectors.toSet()));
    if (lotoDto.getRequestor() != null) loto.setRequestor(userService.toEntity(lotoDto.getRequestor()));
    if (lotoDto.getPermitType() != null) loto.setPermitType(valueService.valueToEntity(lotoDto.getPermitType()));
    if (lotoDto.getDocNum() != null) loto.setDocNum(lotoDto.getDocNum());
    if (lotoDto.getPermitStatus() != null) loto.setPermitStatus(valueService.valueToEntity(lotoDto.getPermitStatus()));
    if (lotoDto.getTemp() != null) loto.setTemp(lotoDto.getTemp());
    
    return loto;
}
}
