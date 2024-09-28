package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities.equipment.EqBreaker;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EqBreakerRepo extends BaseRepository<EqBreaker> {
    @Query("SELECT DISTINCT e.tagNumber FROM HtBreaker e")
    List<String> findDistinctByTagNumber();
}
