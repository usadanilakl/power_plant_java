package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.permits.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.BasePermit;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class BaseItemMapper<Entity, Dto> {
    private final ModelMapper itemMapper;

    public BaseItemMapper(ModelMapper itemMapper) {
        this.itemMapper = itemMapper;
    }

    public Entity convertToEntity(Dto dto, Class<Entity> entityClass){
        return itemMapper.map(dto, entityClass);
    }
    public Dto convertToDto(Entity entity, Class<Dto> dtoClass){
        return itemMapper.map(entity,dtoClass);
    }
}
