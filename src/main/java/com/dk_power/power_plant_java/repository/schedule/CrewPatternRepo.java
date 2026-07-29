package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.CrewPattern;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface CrewPatternRepo extends BaseRepository<CrewPattern> {

    List<CrewPattern> findByIsActiveTrue();
}
