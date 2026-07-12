package com.dk_power.power_plant_java.repository.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundInstance;
import com.dk_power.power_plant_java.entities.rounds.RoundInstanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundInstanceRepository extends JpaRepository<RoundInstance, Long> {
    List<RoundInstance> findByRoundIdOrderByStartedAtDesc(Long roundId);
    List<RoundInstance> findByStatus(RoundInstanceStatus status);
    List<RoundInstance> findByPerformedByAndStatus(String performedBy, RoundInstanceStatus status);
    RoundInstance findFirstByRoundIdAndStatusOrderBySubmittedAtDesc(Long roundId, RoundInstanceStatus status);
}
