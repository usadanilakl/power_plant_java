package com.dk_power.power_plant_java.repository.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProReport;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EtaProReportRepo extends BaseRepository<EtaProReport> {
    List<EtaProReport> findByCategory(String category);
    Page<EtaProReport> findAllByOrderByDateModifiedDesc(Pageable pageable);
}
