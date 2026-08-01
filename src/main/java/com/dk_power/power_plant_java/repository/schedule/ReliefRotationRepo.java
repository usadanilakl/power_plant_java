package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.ReliefRotation;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface ReliefRotationRepo extends BaseRepository<ReliefRotation> {
    List<ReliefRotation> findByIsActiveTrue();
}
