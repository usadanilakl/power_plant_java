package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.categories.BaseCategoryValueRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

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


}
