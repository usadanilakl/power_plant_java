package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.mappers.HtBreakerMapper;
import com.dk_power.power_plant_java.repository.equipment.HtBreakerRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface HtBreakerService extends CrudService<HtBreaker, HtBreakerDto, HtBreakerRepo, HtBreakerMapper> {
}
