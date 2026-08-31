package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

import java.util.List;

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

    /**
     * Packages that are not closed and not soft-deleted.
     *
     * <p>{@code deleted = false} is stated explicitly: {@code @Where} lives on {@code BaseIdEntity},
     * which is a {@code @MappedSuperclass}, and Hibernate does NOT inherit it — neither
     * DailyPermitPackage nor JobLog re-declares it, so soft-deleted rows are otherwise returned.
     */
    /*
     * NOTE on the LEFT JOIN below.
     *
     * `j.jobStatus.name` / `p.packageStatus.name` in a WHERE clause is an IMPLICIT INNER JOIN in
     * JPQL, so every row whose status FK is NULL is dropped before the `IS NULL` branch is ever
     * evaluated. A null status is not an edge case here: it is the codebase's own convention for
     * "Building" (see NgDailyPermitPackageService, which reads null as "Building" in four places),
     * and it is the state of the large majority of open packages. The admin stale sweep reported
     * 5 candidates against 154 genuinely-open packages until this was made an explicit LEFT JOIN.
     *
     * <p>"Not Closed" is not enough on its own: automatic expiry introduced "Expired", which is
     * every bit as terminal. Without it the stale sweep would keep offering to close packages the
     * timer had already dealt with, and the expiry sweep would keep re-reading them.
     */
    @Query("SELECT p FROM DailyPermitPackage p LEFT JOIN p.packageStatus s "
            + "WHERE (p.deleted IS NULL OR p.deleted = false) "
            + "AND (s IS NULL OR LOWER(s.name) NOT IN ('closed', 'expired', 'cancelled', 'canceled'))")
    List<DailyPermitPackage> findAllOpenPackages();
}
