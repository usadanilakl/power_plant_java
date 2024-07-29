package com.dk_power.power_plant_java.mappers.equipment;

import com.dk_power.power_plant_java.dto.equipment.EqBreakerDto;
import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.EqBreaker;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.equipment.EqBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class EqBreakerMapper implements BaseMapper {

    private final EqBreakerService eqBreakerService;
    private final EquipmentService equipmentService;

    public EqBreakerMapper(@Lazy EqBreakerService eqBreakerService, @Lazy EquipmentService equipmentService) {
        this.eqBreakerService = eqBreakerService;
        this.equipmentService = equipmentService;
    }


    @Override
    public ModelMapper getMapper() {
        return null;
    }
    public EqBreakerDto convertToDto(EqBreaker entity){
        if(entity!=null){
            EqBreakerDto dto = new EqBreakerDto();
            if(entity.getTagNumber()!=null) dto.setTagNumber(entity.getTagNumber());
            if(entity.getId()!=null) dto.setId(entity.getId());
            if(entity.getName()!=null) dto.setName(entity.getName());
            if(entity.getObjectType()!=null) dto.setObjectType(entity.getObjectType());
//            if(entity.getPanel()!=null) dto.setPanel(htPanelService.convertToDto(entity.getPanel()));
            if(entity.getEquipmentList()!=null) dto.setEquipmentList(entity.getEquipmentList().stream().map(equipmentService::convertToDto).toList());
            return dto;
        }
        return null;
    }
    public EqBreaker convertToEntity(EqBreakerDto dto){
        if(dto!=null){
            EqBreaker entity = null;
            if(dto.getId()==null)entity = new EqBreaker();
            else entity = eqBreakerService.getEntityById(dto.getId());

            if(dto.getTagNumber()!=null) entity.setTagNumber(dto.getTagNumber());
            if(dto.getName()!=null) entity.setName(dto.getName());
//            if(dto.getPanel()!=null) entity.setPanel(htPanelService.convertToEntity(dto.getPanel()));
            if(dto.getEquipmentList()!=null) entity.setEquipmentList(dto.getEquipmentList().stream().map(equipmentService::convertToEntity).toList());
            return entity;
        }
        return null;
    }
}
