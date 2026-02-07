package com.dk_power.power_plant_java.repository.fire_impairment;

import com.dk_power.power_plant_java.entities.fire_impairment.FireImpairment;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface FireImpairmentRepo extends BaseRepository<FireImpairment> {

    List<FireImpairment> findAllByIsActiveTrueOrderByDateCreatedDesc();

    List<FireImpairment> findAllByIsActiveFalseOrderByDateCreatedDesc();

    List<FireImpairment> findAllByOrderByDateCreatedDesc();
}
