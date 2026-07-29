package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.CoverageRequest;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface CoverageRequestRepo extends BaseRepository<CoverageRequest> {

    List<CoverageRequest> findByStatus(String status);

    List<CoverageRequest> findByPtoRequest_Id(Long ptoRequestId);

    /** Coverage requests whose range overlaps [from, to] — used to compute open seats / chips. */
    @Query("select c from CoverageRequest c where c.startDate <= :to and c.endDate >= :from")
    List<CoverageRequest> findOverlapping(LocalDate from, LocalDate to);
}
