package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HtBreakerRepo extends BaseRepository<HtBreaker> {
    @Query("SELECT DISTINCT e.tagNumber FROM HtBreaker e")
    List<String> findDistinctByTagNumber();

    List<HtBreaker> findByTagNumber(String b);
}
