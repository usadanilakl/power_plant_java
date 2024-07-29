package com.dk_power.power_plant_java.mappers.equipment;

import com.dk_power.power_plant_java.dto.equipment.ElectricalPanelDto;
import com.dk_power.power_plant_java.dto.equipment.HtPanelDto;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import com.dk_power.power_plant_java.sevice.equipment.EqBreakerService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.awt.*;

@Component
public class ElectricalPanelMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ElectricalPanelService electricalPanelService;
    private final EqBreakerService eqBreakerService;

    public ElectricalPanelMapper(ModelMapper modelMapper, @Lazy ElectricalPanelService electricalPanelService, EqBreakerService eqBreakerService) {
        this.modelMapper = modelMapper;
        this.electricalPanelService = electricalPanelService;
        this.eqBreakerService = eqBreakerService;
    }


    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
    public ElectricalPanelDto convertToDto(ElectricalPanel entity){
        if(entity!=null){
            ElectricalPanelDto dto = new ElectricalPanelDto();

            if(entity.getId()!=null) dto.setId(entity.getId());
            if(entity.getEqBreakers()!=null) dto.setEqBreakers(entity.getEqBreakers().stream().map(eqBreakerService::convertToDto).toList());
            if(entity.getName()!=null) dto.setName(entity.getName());
            if(entity.getLocation()!=null) dto.setLocation(entity.getLocation());
            if(entity.getTagNumber()!=null) dto.setTagNubmer(entity.getTagNumber());
            if(entity.getObjectType()!=null)dto.setObjectType(entity.getObjectType());

            return dto;
        }
        return null;
    }
    public ElectricalPanel convertToEntity(ElectricalPanelDto dto){
        if(dto!=null){
            ElectricalPanel entity = null;
            if(dto.getId()==null) entity = new ElectricalPanel();
            else entity = electricalPanelService.getEntityById(dto.getId());

            if(dto.getId()!=null) entity.setId(dto.getId());
            if(dto.getEqBreakers()!=null) entity.setEqBreakers(dto.getEqBreakers().stream().map(eqBreakerService::convertToEntity).toList());
            if(dto.getName()!=null) entity.setName(dto.getName());
            if(dto.getLocation()!=null) entity.setLocation(dto.getLocation());
            if(dto.getTagNubmer()!=null) entity.setTagNumber(dto.getTagNubmer());

            return entity;
        }
        return null;
    }
}
