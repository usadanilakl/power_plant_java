package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.LotoTemp;
import com.dk_power.power_plant_java.entities.permits.SwTemp;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface SwTempRepo extends CrudRepository<SwTemp, String> {
    Optional<SwTemp> findByCreatedBy(String name);
}
