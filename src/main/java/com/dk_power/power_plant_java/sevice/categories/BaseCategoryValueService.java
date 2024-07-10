package com.dk_power.power_plant_java.sevice.categories;

import com.dk_power.power_plant_java.entities.base_entities.BaseEntity;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.repository.categories.BaseCategoryValueRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface BaseCategoryValueService
        <
        E extends BaseEntity,
        D,
        R extends BaseCategoryValueRepo<E>,
        M extends BaseMapper
        >
    extends CrudService<E,D,R,M>
{
    default List<E> getByName(String name){
        return getRepo().findByName(name);
    }
    default E createIfNotExists(String name) {
        List<E> entities = getByName(name);
        if(entities==null || entities.isEmpty()){
            E entity = getEntity();
            entity.setName(name);
            save(entity);
            return entity;
        }
        if(entities.size()==1) return entities.getFirst();
        else throw new RuntimeException();
    }
    default E createNew(D dto){
        E permit = getMapper().convert(dto, getEntity());
        permit.setDocNum(generatePermitNum());
        permit.setStatus(Status.INACTIVE);
        permit.setTemp(false);
        return save(permit);
    }
}
