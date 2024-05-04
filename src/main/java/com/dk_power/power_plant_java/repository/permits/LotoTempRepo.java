package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.LotoTemp;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface LotoTempRepo extends CrudRepository<LotoTemp, String> {
    Optional<LotoTemp> findByCreatedBy(String name);
}
