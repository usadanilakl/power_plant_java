package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.CrewAssignment;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface CrewAssignmentRepo extends BaseRepository<CrewAssignment> {

    List<CrewAssignment> findByIsActiveTrue();

    List<CrewAssignment> findByCrew_Id(Long crewId);

    /** Active assignments whose window overlaps [from, to]. Null startDate/endDate = open-ended (always active). */
    @Query("select a from CrewAssignment a where a.isActive = true "
            + "and (a.startDate is null or a.startDate <= :to) "
            + "and (a.endDate is null or a.endDate >= :from)")
    List<CrewAssignment> findActiveOverlapping(LocalDate from, LocalDate to);
}
