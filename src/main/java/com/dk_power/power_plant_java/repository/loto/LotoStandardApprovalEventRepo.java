package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.LotoStandardApprovalEvent;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface LotoStandardApprovalEventRepo extends BaseRepository<LotoStandardApprovalEvent> {
    List<LotoStandardApprovalEvent> findByStandard_IdOrderByEventAtAsc(Long standardId);
}
