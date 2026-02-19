package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.DedupIdRemap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DedupIdRemapRepository extends JpaRepository<DedupIdRemap, Long> {
    List<DedupIdRemap> findAll();
}
