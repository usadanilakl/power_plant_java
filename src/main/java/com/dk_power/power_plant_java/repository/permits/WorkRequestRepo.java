package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;

import java.util.List;
import java.util.Optional;

public interface WorkRequestRepo extends PermitRepo<WorkRequest> {
    boolean existsBySharepointId(String id);

    List<WorkRequest> findAllBySharepointId(String id);

    Optional<WorkRequest> findFirstBySharepointIdOrderByIdAsc(String id);

    // PWA tracking
    Optional<WorkRequest> findFirstByLocalUuidOrderByIdAsc(String localUuid);

    // PWA permit status
    List<WorkRequest> findBySubmitterEmailIgnoreCase(String email);
}
