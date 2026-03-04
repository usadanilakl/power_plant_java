package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.repository.base_repositories.PermitRepo;

import java.util.Optional;

public interface HotWorkRepo extends BaseRepository<HotWork> {
    Optional<HotWork> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
}
