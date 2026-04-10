package com.dk_power.power_plant_java.repository.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob.Mode;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob.Status;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EtaProScrapeJobRepo extends BaseRepository<EtaProScrapeJob> {

    /**
     * Oldest PENDING HISTORY job — the one the worker should pick up next.
     */
    Optional<EtaProScrapeJob> findFirstByModeAndStatusOrderByDateCreatedAsc(Mode mode, Status status);

    List<EtaProScrapeJob> findByStatus(Status status);

    List<EtaProScrapeJob> findByStatusIn(List<Status> statuses);

    Page<EtaProScrapeJob> findByModeOrderByDateCreatedDesc(Mode mode, Pageable pageable);

    Page<EtaProScrapeJob> findAllByOrderByDateCreatedDesc(Pageable pageable);

    List<EtaProScrapeJob> findByStatusAndCompletedAtBefore(Status status, LocalDateTime cutoff);
}
