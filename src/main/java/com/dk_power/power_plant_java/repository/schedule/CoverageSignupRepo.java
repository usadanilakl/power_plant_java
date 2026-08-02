package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface CoverageSignupRepo extends BaseRepository<CoverageSignup> {

    List<CoverageSignup> findByCoverageRequest_Id(Long coverageRequestId);

    List<CoverageSignup> findByCoverageRequest_IdAndStatus(Long coverageRequestId, String status);

    /** Signups for one request/day/status — used to auto-reject leftover PENDING signups once a
     *  request's seats fill (shift is implied: all signups on a request share its shift). */
    List<CoverageSignup> findByCoverageRequest_IdAndDateAndStatus(Long coverageRequestId, LocalDate date, String status);

    /** All signups on a given day in a given status — used by the materialiser to place coverers. */
    List<CoverageSignup> findByDateAndStatus(LocalDate date, String status);

    /** Signups across a range in a given status — preloaded by the materialiser (grouped per day). */
    List<CoverageSignup> findByDateBetweenAndStatus(LocalDate from, LocalDate to, String status);

    /** All signups across a range (any status) — the admin grid "Sign-ups" overlay. */
    List<CoverageSignup> findByDateBetween(LocalDate from, LocalDate to);

    /** Same as {@link #findByDateBetween} but eager-fetches user/approvedBy/coverageRequest so
     *  rendering the range (toDto) doesn't N+1 lazy-load them per row. */
    @Query("select s from CoverageSignup s "
            + "left join fetch s.user "
            + "left join fetch s.approvedBy "
            + "left join fetch s.coverageRequest "
            + "where s.date between :from and :to")
    List<CoverageSignup> findByDateBetweenFetch(LocalDate from, LocalDate to);

    long countByCoverageRequest_IdAndDateAndStatus(Long coverageRequestId, LocalDate date, String status);

    /** All of a user's signups on a given day, across every request — used to enforce "one coverage
     *  seat per person per day" (a person works one shift, so they can't cover two needs the same day). */
    List<CoverageSignup> findByUser_IdAndDate(Long userId, LocalDate date);
}
