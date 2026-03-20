package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.JobLog;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JobLogRepo extends BaseRepository<JobLog> {
    @Query("SELECT j FROM JobLog j JOIN j.packages p WHERE p.id = :packageId")
    Optional<JobLog> findByPackageId(@Param("packageId") Long packageId);

    @Query("SELECT j FROM JobLog j WHERE j.jobStatus IS NULL OR j.jobStatus.name <> 'Closed'")
    List<JobLog> findAllOpenJobs();

    @Query("SELECT j FROM JobLog j WHERE j.company = :company " +
           "AND j.workArea.id = :workAreaId " +
           "AND j.workCategory.id = :categoryId " +
           "AND (j.jobStatus IS NULL OR j.jobStatus.name NOT IN ('Closed', 'Cancelled'))")
    Optional<JobLog> findOpenJobByGroupingKey(
        @Param("company") String company,
        @Param("workAreaId") Long workAreaId,
        @Param("categoryId") Long categoryId);
}
