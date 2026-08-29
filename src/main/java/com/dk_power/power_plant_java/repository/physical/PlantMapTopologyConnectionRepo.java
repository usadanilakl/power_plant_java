package com.dk_power.power_plant_java.repository.physical;

import com.dk_power.power_plant_java.entities.physical.PlantMapTopologyConnection;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PlantMapTopologyConnectionRepo extends BaseRepository<PlantMapTopologyConnection> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select connection from PlantMapTopologyConnection connection order by connection.id")
    List<PlantMapTopologyConnection> findAllForUpdate();
}
