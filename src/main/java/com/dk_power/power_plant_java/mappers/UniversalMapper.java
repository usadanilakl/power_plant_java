package com.dk_power.power_plant_java.mappers;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;
@Component
public class UniversalMapper {
    private final ModelMapper mapper;

    public UniversalMapper(ModelMapper mapper) {
        this.mapper = mapper;
    }
    public <T> T convert(Object objectToBeConverted, T convertedObject) {
        return mapper.map(objectToBeConverted, (Type) convertedObject.getClass());
    }
}
