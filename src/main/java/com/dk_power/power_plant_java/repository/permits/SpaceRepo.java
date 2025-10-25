package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.Space;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpaceRepo extends JpaRepository<Long, Space> {
}
