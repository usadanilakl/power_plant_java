package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DailyPermitPackageRepo extends BaseRepository<DailyPermitPackage> {
    @Query("SELECT dpp FROM DailyPermitPackage dpp JOIN dpp.workRequests wr WHERE wr.id = :workRequestId")
    Optional<DailyPermitPackage> findByWorkRequestId(@Param("workRequestId") Long workRequestId);

    @Query("SELECT dpp.id FROM DailyPermitPackage dpp JOIN dpp.safeWorks sw WHERE sw.id = :permitId")
    Optional<Long> findPackageIdBySafeWorkId(@Param("permitId") Long permitId);

    @Query("SELECT dpp.id FROM DailyPermitPackage dpp JOIN dpp.hotWorks hw WHERE hw.id = :permitId")
    Optional<Long> findPackageIdByHotWorkId(@Param("permitId") Long permitId);

    @Query("SELECT dpp.id FROM DailyPermitPackage dpp JOIN dpp.confinedSpaces cs WHERE cs.id = :permitId")
    Optional<Long> findPackageIdByConfinedSpaceId(@Param("permitId") Long permitId);

    @Query("SELECT dpp.id FROM DailyPermitPackage dpp JOIN dpp.lotos l WHERE l.id = :permitId")
    Optional<Long> findPackageIdByLotoId(@Param("permitId") Long permitId);

    @Query("SELECT dpp.id FROM DailyPermitPackage dpp JOIN dpp.energizedWorkPermits ep WHERE ep.id = :permitId")
    Optional<Long> findPackageIdByEnergizedWorkPermitId(@Param("permitId") Long permitId);

    @Query("SELECT dpp.id FROM DailyPermitPackage dpp JOIN dpp.excavationPermits ep WHERE ep.id = :permitId")
    Optional<Long> findPackageIdByExcavationPermitId(@Param("permitId") Long permitId);

    @Query("SELECT dpp.id FROM DailyPermitPackage dpp JOIN dpp.ventingPermits vp WHERE vp.id = :permitId")
    Optional<Long> findPackageIdByVentingPermitId(@Param("permitId") Long permitId);
}
