package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.ScheduleDayOverride;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleDayOverrideRepo extends BaseRepository<ScheduleDayOverride> {

    List<ScheduleDayOverride> findByDate(LocalDate date);

    List<ScheduleDayOverride> findByDateBetween(LocalDate from, LocalDate to);
}
