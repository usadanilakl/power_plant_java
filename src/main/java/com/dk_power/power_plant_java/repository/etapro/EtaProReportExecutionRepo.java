package com.dk_power.power_plant_java.repository.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProReportExecution;
import com.dk_power.power_plant_java.entities.etapro.EtaProReportExecution.Status;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface EtaProReportExecutionRepo extends BaseRepository<EtaProReportExecution> {
    Page<EtaProReportExecution> findByReportIdOrderByDateCreatedDesc(Long reportId, Pageable pageable);
    Page<EtaProReportExecution> findAllByOrderByDateCreatedDesc(Pageable pageable);
    Optional<EtaProReportExecution> findFirstByStatusOrderByDateCreatedAsc(Status status);
    List<EtaProReportExecution> findByStatus(Status status);
}
