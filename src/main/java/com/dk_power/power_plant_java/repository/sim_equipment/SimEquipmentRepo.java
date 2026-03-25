package com.dk_power.power_plant_java.repository.sim_equipment;

import com.dk_power.power_plant_java.entities.sim_equipment.SimEquipment;
import com.dk_power.power_plant_java.entities.sim_equipment.SourceEntityType;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SimEquipmentRepo extends BaseRepository<SimEquipment> {
    @Query("""
        SELECT s FROM SimEquipment s
        WHERE LOWER(COALESCE(s.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(COALESCE(s.description, '')) LIKE LOWER(CONCAT('%', :query, '%'))
    """)
    List<SimEquipment> searchByNameOrDescription(@Param("query") String query);
    Optional<SimEquipment> findBySourceEntityTypeAndSourceEntityId(SourceEntityType type, Long id);
}
