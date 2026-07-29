package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.ScheduleEvent;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleEventRepo extends BaseRepository<ScheduleEvent> {

    /** Events whose [startDate, endDate] window overlaps [from, to] (endDate null = single-day at startDate). */
    @Query("select e from ScheduleEvent e where e.startDate <= :to "
            + "and (e.endDate is null or e.endDate >= :from)")
    List<ScheduleEvent> findOverlapping(LocalDate from, LocalDate to);
}
