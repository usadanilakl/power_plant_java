package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.RedTagStandard;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface RedTagStandardRepo extends BaseRepository<RedTagStandard> {

    /** Idempotent-import guard — skip seeding a standard whose name already exists. */
    RedTagStandard findFirstByNameIgnoreCase(String name);

    /** All standards for a plant unit ("U1" / "U2" / "BOP"), name-ordered. */
    List<RedTagStandard> findByUnitOrderByNameAsc(String unit);
}
