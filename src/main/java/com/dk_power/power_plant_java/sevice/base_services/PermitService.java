package com.dk_power.power_plant_java.sevice.base_services;

import com.dk_power.power_plant_java.entities.base_entities.BasePermit;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PermitService
        <
        E extends BasePermit,
        D,
        R extends BaseRepository<E>,
        M extends BaseMapper
        >
    extends CrudService<E,D,R,M>, AuditingService<E>

{

    default E createNew(D dto){
        E permit = getMapper().convert(dto, getEntity());
        permit.setDocNum(generatePermitNum());
        permit.setStatus(Status.INACTIVE);
        permit.setTemp(false);
        return save(permit);
    }
    default E changeStatus(Long id, Status status){
        E permit = getEntityById(id);
        permit.setStatus(status);
        return save(permit);
    }
    default E getTempPermit(){
        List<E> temps = getRepo().findByTempTrue();
        return temps.stream().filter(e -> e.getCreatedBy().equalsIgnoreCase(getLoggedInUserName())).findAny().orElse(getEntity());

    }
    default Long generatePermitNum(){
        Long lastCreatedNumber = getRepo().findMaxPermitNum();
        String yearr = LocalDateTime.now().getYear()+"0000";
        Long year =Long.parseLong(yearr.substring(2));
        if(lastCreatedNumber == null||year>lastCreatedNumber){
            return year;
        }else{
            return lastCreatedNumber+1;
        }
    }
    default void resetFields(){
        E tempPermit = getTempPermit();
        Long id = tempPermit.getId();
        tempPermit = getEntity();
        tempPermit.setId(id);
        save(tempPermit);
    }
}
