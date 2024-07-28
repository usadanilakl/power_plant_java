package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class HtBreakerMapper implements BaseMapper{
    private final HeatTraceService heatTraceService;
    private final HtPanelService htPanelService;
    private final HtBreakerService htBreakerService;

    public HtBreakerMapper(@Lazy HeatTraceService heatTraceService, @Lazy HtPanelService htPanelService, @Lazy HtBreakerService htBreakerService) {
        this.heatTraceService = heatTraceService;
        this.htPanelService = htPanelService;
        this.htBreakerService = htBreakerService;
    }

    @Override
    public ModelMapper getMapper() {
        return null;
    }
    public HtBreakerDto convertToDto(HtBreaker entity){
        if(entity!=null){
            HtBreakerDto dto = new HtBreakerDto();
            if(entity.getTagNumber()!=null) dto.setTagNumber(entity.getTagNumber());
            if(entity.getId()!=null) dto.setId(entity.getId());
            if(entity.getName()!=null) dto.setName(entity.getName());
            if(entity.getObjectType()!=null) dto.setObjectType(entity.getObjectType());
            if(entity.getPanel()!=null) dto.setPanel(htPanelService.convertToDto(entity.getPanel()));
            if(entity.getEquipmentList()!=null) dto.setEquipmentList(entity.getEquipmentList().stream().map(heatTraceService::convertToDto).toList());
            return dto;
        }
        return null;
    }
    public HtBreaker convertToEntity(HtBreakerDto dto){
        if(dto!=null){
            HtBreaker entity = null;
            if(dto.getId()==null)entity = new HtBreaker();
            else entity = htBreakerService.getEntityById(dto.getId());

            if(dto.getTagNumber()!=null) entity.setTagNumber(dto.getTagNumber());
            if(dto.getName()!=null) entity.setName(dto.getName());
            if(dto.getPanel()!=null) entity.setPanel(htPanelService.convertToEntity(dto.getPanel()));
            if(dto.getEquipmentList()!=null) entity.setEquipmentList(dto.getEquipmentList().stream().map(heatTraceService::convertToEntity).toList());
            return entity;
        }
        return null;
    }
}
