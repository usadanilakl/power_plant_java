package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class RepositoryConfig {

    @Bean
    public Map<Class<?>, JpaRepository<?, Long>> repositories(List<JpaRepository<?, Long>> repositoryList) {
        Map<Class<?>, JpaRepository<?, Long>> repositoryMap = new HashMap<>();
        for (JpaRepository<?, Long> repository : repositoryList) {
            Class<?> entityClass = getEntityClass(repository);
            if (entityClass != null && BaseIdEntity.class.isAssignableFrom(entityClass)) {
                repositoryMap.put(entityClass, repository);
            }
        }
        return repositoryMap;
    }

    private Class<?> getEntityClass(JpaRepository<?, Long> repository) {
        Type[] interfaces = repository.getClass().getGenericInterfaces();
        for (Type type : interfaces) {
            if (type instanceof ParameterizedType) {
                ParameterizedType parameterizedType = (ParameterizedType) type;
                if (JpaRepository.class.equals(parameterizedType.getRawType())) {
                    Type[] typeArguments = parameterizedType.getActualTypeArguments();
                    if (typeArguments.length > 0 && typeArguments[0] instanceof Class) {
                        return (Class<?>) typeArguments[0];
                    }
                }
            }
        }
        return null;
    }
}