package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.Crew;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface CrewRepo extends BaseRepository<Crew> {
    List<Crew> findByIsActiveTrue();
}
