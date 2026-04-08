package com.dk_power.power_plant_java.repository.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface EtaProPointRepo extends BaseRepository<EtaProPoint> {
    List<EtaProPoint> findByActiveTrue();
    Optional<EtaProPoint> findByPointId(String pointId);
    List<EtaProPoint> findByCategory(String category);
}
