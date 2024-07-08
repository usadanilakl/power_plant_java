package com.dk_power.power_plant_java.mappers;

import lombok.AllArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

@Component
public class UniversalMapper implements BaseMapper{
    private final ModelMapper mapper;

    public UniversalMapper(ModelMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public ModelMapper getMapper() {
        return mapper;
    }

    public <T> T convert(Object objectToBeConverted, T convertedObject) {
        return mapper.map(objectToBeConverted, (Type) convertedObject.getClass());
    }
    public <T1,T2> List<T1> convertAll(List<T2> listToBeConverted, T1 convertedObject){
        List<T1> result = new ArrayList<>();
        for (Object o : listToBeConverted) {
            result.add(convert(o,convertedObject));
        }
        return result;
    }
}
