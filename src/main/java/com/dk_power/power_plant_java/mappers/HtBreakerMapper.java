package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class HtBreakerMapper implements BaseMapper{
    private final HeatTraceService heatTraceService;
    private final HtPanelService htPanelService;

    public HtBreakerMapper(HeatTraceService heatTraceService, HtPanelService htPanelService) {
        this.heatTraceService = heatTraceService;
        this.htPanelService = htPanelService;
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
            if(entity.getEquipmentList()!=null) dto.setEquipment(entity.getEquipmentList().stream().map(heatTraceService::convertToDto).toList());
            return dto;
        }
        return null;
    }
    public HtBreaker convertToDto(HtBreakerDto dto){
        if(dto!=null){
            HtBreaker entity = new HtBreaker();
            if(dto.getTagNumber()!=null) entity.setTagNumber(dto.getTagNumber());
            if(dto.getId()!=null) entity.setId(dto.getId());
            if(dto.getName()!=null) entity.setName(dto.getName());
            if(dto.getPanel()!=null) entity.setPanel(htPanelService.convertToEntity(dto.getPanel()));
            if(dto.getEquipment()!=null) entity.setEquipmentList(dto.getEquipment().stream().map(heatTraceService::convertToEntity).toList());
            return entity;
        }
        return null;
    }
}
