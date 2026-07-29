package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.PtoRequest;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PtoRequestRepo extends BaseRepository<PtoRequest> {

    boolean existsBySourceRequestId(String sourceRequestId);

    boolean existsByDedupHash(String dedupHash);

    Optional<PtoRequest> findFirstBySourceRequestId(String sourceRequestId);

    List<PtoRequest> findByStatus(String status);

    /** APPROVED PTO whose range overlaps [from, to]. Drives the {@code P} cells + coverage creation. */
    @Query("select p from PtoRequest p where p.status = 'APPROVED' "
            + "and p.startDate <= :to and p.endDate >= :from")
    List<PtoRequest> findApprovedOverlapping(LocalDate from, LocalDate to);
}
