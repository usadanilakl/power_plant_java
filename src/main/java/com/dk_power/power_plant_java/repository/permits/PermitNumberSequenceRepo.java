package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.PermitNumberSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PermitNumberSequenceRepo extends JpaRepository<PermitNumberSequence, Long> {
    Optional<PermitNumberSequence> findByDateAndDeviceNumber(LocalDate date, int deviceNumber);
}
