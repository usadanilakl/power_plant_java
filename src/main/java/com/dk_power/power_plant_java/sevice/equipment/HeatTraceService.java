package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.mappers.equipment.HeatTraceMapper;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface HeatTraceService extends CrudService<HeatTrace, HeatTraceDto, HeatTraceRepo, HeatTraceMapper> {
    void transferToDb();

    List<HeatTrace> getByTagNumber(String s);

    List<String> getAllTags();

    List<HeatTrace> getIfTagContains(String tag);
}
