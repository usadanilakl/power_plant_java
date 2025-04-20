package com.dk_power.power_plant_java.repository.loto;


import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LockRepo extends BaseRepository<Lock> {
    List<Lock> findByLotoId(Long lotoId);
}
