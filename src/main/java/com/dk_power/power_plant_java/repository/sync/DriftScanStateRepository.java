package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.DriftScanState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DriftScanStateRepository extends JpaRepository<DriftScanState, Long> {
    Optional<DriftScanState> findByEntityType(String entityType);
}
