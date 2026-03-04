package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.VentingPermit;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VentingPermitRepo extends BaseRepository<VentingPermit> {
    Optional<VentingPermit> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
}
