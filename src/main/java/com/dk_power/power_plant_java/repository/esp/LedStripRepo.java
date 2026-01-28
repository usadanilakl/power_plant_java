package com.dk_power.power_plant_java.repository.esp;

import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LedStripRepo extends BaseRepository<LedStrip> {
    List<LedStrip> findByEspDeviceId(Long espDeviceId);

    Optional<LedStrip> findByEspDeviceIdAndStripNumber(Long espDeviceId, Integer stripNumber);

    Optional<LedStrip> findByGpioPin(Integer gpioPin);

    @Query("SELECT COUNT(l) FROM LedStrip l WHERE l.espDevice.id = :espDeviceId")
    long countByEspDeviceId(@Param("espDeviceId") Long espDeviceId);
}