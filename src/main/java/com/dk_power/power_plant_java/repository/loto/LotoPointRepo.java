package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface LotoPointRepo extends BaseRepository<LotoPoint> {
    LotoPoint findByOldId(String oldId);

    List<LotoPoint> findByNormPos(Value oldVal);

    List<LotoPoint> findByIsoPos(Value oldVal);

    List<LotoPoint> findByTagNumber(String tag);
}
