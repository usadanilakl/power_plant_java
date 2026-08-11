package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.CrewShiftOverride;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface CrewShiftOverrideRepo extends BaseRepository<CrewShiftOverride> {

    /** Active crew-shift overrides whose [startDate, endDate] window overlaps [from, to]. */
    @Query("select o from CrewShiftOverride o where (o.isActive is null or o.isActive = true) "
            + "and o.startDate <= :to and o.endDate >= :from")
    List<CrewShiftOverride> findActiveOverlapping(LocalDate from, LocalDate to);
}
