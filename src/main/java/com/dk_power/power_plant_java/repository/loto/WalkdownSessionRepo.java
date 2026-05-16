package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.WalkdownSession;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface WalkdownSessionRepo extends BaseRepository<WalkdownSession> {
    List<WalkdownSession> findByLoto_IdOrderByStartedAtDesc(Long lotoId);
}
