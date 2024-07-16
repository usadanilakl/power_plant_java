package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.categories.BaseCategoryValueRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public interface BaseCategoryValueService
        <
        E extends BaseAuditEntity,
        D,
        R extends BaseCategoryValueRepo<E>,
        M extends BaseMapper
        >
    extends CrudService<E,D,R,M>
{
    default List<E> getByName(String name){
        return getRepo().findByName(name);
    }
    @Override
     default Set<D> convertAllToDto(Collection<E> list) {
        return list.stream().map(this::convertToDto).collect(Collectors.toSet());
    }

    @Override
    default Set<E> convertAllToEntity(Collection<D> list) {
        return list.stream().map(this::convertToEntity).collect(Collectors.toSet());
    }

}
