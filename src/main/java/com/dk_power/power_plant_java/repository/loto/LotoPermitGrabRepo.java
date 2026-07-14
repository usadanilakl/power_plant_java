package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.LotoPermitGrab;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LotoPermitGrabRepo extends JpaRepository<LotoPermitGrab, Long> {
    List<LotoPermitGrab> findByActiveTrue();
    List<LotoPermitGrab> findByLotoIdAndPhaseAndActiveTrue(Long lotoId, String phase);
    List<LotoPermitGrab> findByLotoIdAndActiveTrue(Long lotoId);
}
