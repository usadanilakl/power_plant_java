package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DailyPermitPackageRepo extends BaseRepository<DailyPermitPackage> {
    @Query("SELECT dpp FROM DailyPermitPackage dpp JOIN dpp.workRequests wr WHERE wr.id = :workRequestId")
    Optional<DailyPermitPackage> findByWorkRequestId(@Param("workRequestId") Long workRequestId);
}
