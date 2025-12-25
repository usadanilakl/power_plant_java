package com.dk_power.power_plant_java.repository.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EspDeviceRepo extends JpaRepository<EspDevice, Long> {
    Optional<EspDevice> findByIpAddress(String ipAddress);
    Optional<EspDevice> findByName(String name);

    @Query("SELECT e FROM EspDevice e WHERE e.isActive = true")
    List<EspDevice> findAllActive();

    @Query("SELECT COUNT(e) FROM EspDevice e WHERE e.isActive = true")
    long countActive();
}