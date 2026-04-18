package com.dk_power.power_plant_java.repository.scheduler;

import com.dk_power.power_plant_java.entities.scheduler.TaskTemplate;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface TaskTemplateRepository extends BaseRepository<TaskTemplate> {
    List<TaskTemplate> findByName(String name);
}
