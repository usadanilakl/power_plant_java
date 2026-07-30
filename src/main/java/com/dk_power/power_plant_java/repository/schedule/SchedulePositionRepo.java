package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.SchedulePosition;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface SchedulePositionRepo extends BaseRepository<SchedulePosition> {
    List<SchedulePosition> findAllByOrderBySortOrderAscNameAsc();
}
