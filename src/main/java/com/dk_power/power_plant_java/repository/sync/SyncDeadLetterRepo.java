package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.SyncDeadLetter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SyncDeadLetterRepo extends JpaRepository<SyncDeadLetter, Long> {

    Optional<SyncDeadLetter> findByChangeIdAndMachineId(UUID changeId, String machineId);

    List<SyncDeadLetter> findByResolvedFalse();

    List<SyncDeadLetter> findByEntityTypeAndResolvedFalse(String entityType);

    long countByResolvedFalse();
}
