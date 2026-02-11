package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.Jha;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JhaRepo extends JpaRepository<Jha, Long> {
    Optional<Jha> findByLocalUuid(String localUuid);
    Optional<Jha> findBySharepointId(String sharepointId);
    List<Jha> findByWorkRequestId(Long workRequestId);
    List<Jha> findByDeletedFalse();
}
