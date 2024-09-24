package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface HeatTraceRepo extends BaseRepository<HeatTrace> {
    List<HeatTrace> findByTagNumber(String s);
}
