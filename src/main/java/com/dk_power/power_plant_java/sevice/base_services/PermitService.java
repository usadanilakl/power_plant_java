package com.dk_power.power_plant_java.sevice.base_services;

import com.dk_power.power_plant_java.entities.base_entities.BasePermit;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

public interface PermitService
        <
        E extends BasePermit,
        D,
        R extends BaseRepository<E>,
        M extends BaseMapper
        >
    extends CrudService<E,D,R,M>

{
    default E createNew(D dto){
        E permit = getMapper().convert(dto, getEntity());
        permit.setDocNum(generatePermitNum());
        permit.setStatus(Status.INACTIVE);
        return save(permit);
    }
    default E changeStatus(Long id, Status status){
        E permit = getEntityById(id);
        permit.setStatus(status);
        return save(permit);
    }
    Loto getTempPermit();
    //    String getLoggedInUserName();
    Long generatePermitNum();
}
