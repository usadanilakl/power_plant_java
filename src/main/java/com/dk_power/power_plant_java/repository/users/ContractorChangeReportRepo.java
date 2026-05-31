package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities.users.ContractorChangeReport;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface ContractorChangeReportRepo extends BaseRepository<ContractorChangeReport> {

    List<ContractorChangeReport> findByStatusOrderByRunAtDesc(ContractorChangeReport.Status status);

    List<ContractorChangeReport> findTop50ByOrderByRunAtDesc();
}
