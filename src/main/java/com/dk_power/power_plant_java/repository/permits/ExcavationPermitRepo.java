package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.ExcavationPermit;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExcavationPermitRepo extends BaseRepository<ExcavationPermit> {
    Optional<ExcavationPermit> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
}
