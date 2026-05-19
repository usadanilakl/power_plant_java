package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LotoStandardRepo extends BaseRepository<LotoStandard> {

    /**
     * Every (non-deleted) standard that contains the given LotoPoint. Used by
     * the pending-review capture service to flag changes on every standard
     * affected by a point edit.
     */
    @Query("SELECT s FROM LotoStandard s JOIN s.lotoPoints p WHERE p.id = :pointId")
    List<LotoStandard> findStandardsContainingPoint(@Param("pointId") Long pointId);
}
