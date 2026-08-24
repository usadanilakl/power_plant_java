package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.JobLog;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JobLogRepo extends BaseRepository<JobLog> {
    @Query("SELECT j FROM JobLog j JOIN j.packages p WHERE p.id = :packageId")
    Optional<JobLog> findByPackageId(@Param("packageId") Long packageId);

    @EntityGraph(attributePaths = {"jobStatus", "workArea", "workCategory", "originatingWorkRequest"})
    @Query("SELECT j FROM JobLog j WHERE j.jobStatus IS NULL OR j.jobStatus.name <> 'Closed'")
    List<JobLog> findAllOpenJobs();

    @Override
    @EntityGraph(attributePaths = {"jobStatus", "workArea", "workCategory", "originatingWorkRequest"})
    List<JobLog> findAll();

    /**
     * Every open job matching the (company, work area, work category) grouping key.
     *
     * <p>Returns a LIST, not an Optional. Job dates are stored as free-form strings in several
     * formats, so a date window cannot be expressed in JPQL; the caller narrows these candidates by
     * date in Java. Picking a single row here was also wrong on its own terms - with no date bound,
     * a contractor's job from two months ago kept absorbing every new request for the same area and
     * category, forever, because nothing ever closes a job automatically.
     */
    @EntityGraph(attributePaths = {"jobStatus", "workArea", "workCategory"})
    @Query("SELECT j FROM JobLog j WHERE j.company = :company " +
           "AND j.workArea.id = :workAreaId " +
           "AND j.workCategory.id = :categoryId " +
           "AND (j.jobStatus IS NULL OR j.jobStatus.name NOT IN ('Closed', 'Cancelled'))")
    List<JobLog> findOpenJobsByGroupingKey(
        @Param("company") String company,
        @Param("workAreaId") Long workAreaId,
        @Param("categoryId") Long categoryId);
}
