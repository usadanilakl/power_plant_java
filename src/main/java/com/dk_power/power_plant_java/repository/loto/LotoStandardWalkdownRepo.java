package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.LotoStandardWalkdown;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LotoStandardWalkdownRepo extends JpaRepository<LotoStandardWalkdown, Long> {
    Optional<LotoStandardWalkdown> findByStandardId(Long standardId);
    void deleteByStandardId(Long standardId);
}
