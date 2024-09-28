package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.EqBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.EqBreaker;
import com.dk_power.power_plant_java.mappers.equipment.EqBreakerMapper;
import com.dk_power.power_plant_java.repository.equipment.EqBreakerRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface EqBreakerService extends CrudService<EqBreaker, EqBreakerDto, EqBreakerRepo, EqBreakerMapper> {
    void transferToDb();
    void transerToDb2();
    List<String> getAllTags();
}
