package com.dk_power.power_plant_java.mappers;

import org.apache.poi.ss.formula.functions.T;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;

public interface BaseMapper <E,D>{
    D convertToDto(E entity);
    E convertToEntity(D dto);
    <T> T convert(Object objectToBeConverted, T convertedObject);

}
