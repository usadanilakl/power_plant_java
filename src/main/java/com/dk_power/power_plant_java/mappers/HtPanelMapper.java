package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.equipment.HtPanelDto;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class HtPanelMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final HtPanelService htPanelService;
    private final HtBreakerService htBreakerService;

    public HtPanelMapper(ModelMapper modelMapper, @Lazy HtPanelService htPanelService, @Lazy HtBreakerService htBreakerService) {
        this.modelMapper = modelMapper;
        this.htPanelService = htPanelService;
        this.htBreakerService = htBreakerService;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
    public HtPanelDto convertToDto(HtPanel entity){
        if(entity!=null){
            HtPanelDto dto = new HtPanelDto();

            if(entity.getId()!=null) dto.setId(entity.getId());
            if(entity.getHtBreakers()!=null) dto.setHtBreakers(entity.getHtBreakers().stream().map(htBreakerService::convertToDto).toList());
            if(entity.getName()!=null) dto.setName(entity.getName());
            if(entity.getLocation()!=null) dto.setLocation(entity.getLocation());
            if(entity.getTagNumber()!=null) dto.setTagNubmer(entity.getTagNumber());
            if(entity.getObjectType()!=null)dto.setObjectType(entity.getObjectType());

            return dto;
        }
        return null;
    }
    public HtPanel convertToEntity(HtPanelDto dto){
        if(dto!=null){
            HtPanel entity = null;
            if(dto.getId()==null) entity = new HtPanel();
            else entity = htPanelService.getEntityById(dto.getId());

            if(dto.getId()!=null) entity.setId(dto.getId());
            if(dto.getHtBreakers()!=null) entity.setHtBreakers(dto.getHtBreakers().stream().map(htBreakerService::convertToEntity).toList());
            if(dto.getName()!=null) entity.setName(dto.getName());
            if(dto.getLocation()!=null) entity.setLocation(dto.getLocation());
            if(dto.getTagNubmer()!=null) entity.setTagNumber(dto.getTagNubmer());

            return entity;
        }
        return null;
    }
}
