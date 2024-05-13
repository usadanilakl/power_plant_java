package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.permits.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.BasePermit;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
public class BasePermitMapper <Entity extends BasePermit, Dto extends BasePermitDto> {
    private final ModelMapper permitMapper;

    public BasePermitMapper(ModelMapper permitMapper) {
        this.permitMapper = permitMapper;
    }

    public Entity convertToEntity(Dto dto, Class<Entity> entityClass){
        return permitMapper.map(dto, entityClass);
    }
    public Dto convertToDto(Entity entity, Class<Dto> dtoClass){
        return permitMapper.map(entity,dtoClass);
    }
}
