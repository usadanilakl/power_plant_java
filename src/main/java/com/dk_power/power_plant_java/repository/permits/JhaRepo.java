package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;

import java.util.List;
import java.util.Optional;

public interface JhaRepo extends PermitRepo<Jha> {
    Optional<Jha> findByLocalUuid(String localUuid);
    Optional<Jha> findBySharepointId(String sharepointId);
    List<Jha> findByWorkRequestId(Long workRequestId);
    boolean existsBySharepointId(String sharepointId);
    List<Jha> findAllBySharepointId(String sharepointId);
    Optional<Jha> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
}
