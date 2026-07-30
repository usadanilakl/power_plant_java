package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.CrewRotation;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface CrewRotationRepo extends BaseRepository<CrewRotation> {
    List<CrewRotation> findByIsActiveTrue();
}
