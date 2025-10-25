package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.ConfinedSpaceLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfinedSpaceLogRepo extends JpaRepository<Long, ConfinedSpaceLog> {
}
