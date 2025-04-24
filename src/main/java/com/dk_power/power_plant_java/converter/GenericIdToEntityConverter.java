package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.core.convert.converter.GenericConverter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

@Component
public class GenericIdToEntityConverter implements GenericConverter {

    private final Map<Class<?>, JpaRepository<?, Long>> repositories;

    public GenericIdToEntityConverter(Map<Class<?>, JpaRepository<?, Long>> repositories) {
        this.repositories = repositories;
    }

    @Override
    public Set<ConvertiblePair> getConvertibleTypes() {
        return Collections.singleton(new ConvertiblePair(String.class, BaseIdEntity.class));
    }

    @Override
    public Object convert(Object source, TypeDescriptor sourceType, TypeDescriptor targetType) {
        if (source == null) {
            return null;
        }

        Class<?> targetClass = targetType.getType();
        JpaRepository<?, Long> repository = repositories.get(targetClass);

        if (repository == null) {
            throw new IllegalArgumentException("No repository found for " + targetClass.getSimpleName());
        }

        Long id = Long.parseLong((String) source);
        return repository.findById(id).orElse(null);
    }
}