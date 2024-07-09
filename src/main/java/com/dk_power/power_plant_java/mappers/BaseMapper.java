package com.dk_power.power_plant_java.mappers;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;

public interface BaseMapper {
    ModelMapper getMapper();

    default  <T> T convert(Object objectToBeConverted, T convertedObject) {
        getMapper().getConfiguration().setSkipNullEnabled(true);
        return getMapper().map(objectToBeConverted, (Type) convertedObject.getClass());
    }
}
