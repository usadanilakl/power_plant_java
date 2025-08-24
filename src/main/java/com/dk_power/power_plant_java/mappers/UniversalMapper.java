package com.dk_power.power_plant_java.mappers;

import lombok.AllArgsConstructor;
import org.modelmapper.Conditions;
import org.modelmapper.ModelMapper;
import org.modelmapper.config.Configuration;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Component
public class UniversalMapper implements BaseMapper {
    private final ModelMapper mapper;

    public UniversalMapper(ModelMapper mapper) {
        this.mapper = mapper;
        configureMapper();
    }

    private void configureMapper() {
        mapper.getConfiguration()
            .setSkipNullEnabled(true)
            .setPropertyCondition(Conditions.isNotNull())
            .setMatchingStrategy(MatchingStrategies.STRICT)
            .setFieldMatchingEnabled(true)
            .setFieldAccessLevel(Configuration.AccessLevel.PRIVATE)
            .setMethodAccessLevel(Configuration.AccessLevel.PRIVATE);
    }

    @Override
    public ModelMapper getMapper() {
        return mapper;
    }

    public <T> T convert(Object objectToBeConverted, Class<T> targetClass) {
        return mapper.map(objectToBeConverted, targetClass);
    }

    public <T1, T2> List<T1> convertAll(List<T2> listToBeConverted, Class<T1> targetClass) {
        return listToBeConverted.stream()
            .map(obj -> convert(obj, targetClass))
            .collect(Collectors.toList());
    }
}
//@Component
//public class UniversalMapper implements BaseMapper{
//    private final ModelMapper mapper;
//
//    public UniversalMapper(ModelMapper mapper) {
//        this.mapper = mapper;
//    }
//
//    @Override
//    public ModelMapper getMapper() {
//        return mapper;
//    }
//
//    public <T> T convert(Object objectToBeConverted, T convertedObject) {
//        mapper.getConfiguration().setSkipNullEnabled(true);
//        return mapper.map(objectToBeConverted, (Type) convertedObject.getClass());
//    }
//    public <T1,T2> List<T1> convertAll(List<T2> listToBeConverted, T1 convertedObject){
//        List<T1> result = new ArrayList<>();
//        for (Object o : listToBeConverted) {
//            result.add(convert(o,convertedObject));
//        }
//        return result;
//    }
//}
