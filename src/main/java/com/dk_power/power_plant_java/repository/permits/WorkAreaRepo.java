package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkAreaRepo extends BaseRepository<WorkArea> {
    List<WorkArea> findByAreaType_Id(Long typeId);
    List<WorkArea> findByShape_Id(Long shapeId);
    Optional<WorkArea> findFirstByNameIgnoreCase(String name);
}
