package com.dk_power.power_plant_java.repository.maximo;

import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface RecurringPmRepo extends BaseRepository<RecurringPm> {

    Optional<RecurringPm> findFirstByPmKey(String pmKey);

    List<RecurringPm> findAllByOrderByPmnumAsc();
}
