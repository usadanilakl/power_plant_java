package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.WorkAreaMapShape;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkAreaMapShapeRepo extends BaseRepository<WorkAreaMapShape> {
    WorkAreaMapShape findByName(String name);
}
