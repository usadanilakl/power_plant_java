package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;

import java.util.Optional;

public interface WorkRequestRepo extends PermitRepo<WorkRequest> {
    boolean existsBySharepointId(String id);

    Optional<WorkRequest> findBySharepointId(String id);
}
