package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.WalkdownChecklist;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface WalkdownChecklistRepo extends BaseRepository<WalkdownChecklist> {
    List<WalkdownChecklist> findByLoto_IdOrderByRequestedAtDesc(Long lotoId);
}
