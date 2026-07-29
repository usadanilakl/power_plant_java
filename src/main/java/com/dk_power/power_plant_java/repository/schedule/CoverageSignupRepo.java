package com.dk_power.power_plant_java.repository.schedule;

import com.dk_power.power_plant_java.entities.schedule.CoverageSignup;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.time.LocalDate;
import java.util.List;

public interface CoverageSignupRepo extends BaseRepository<CoverageSignup> {

    List<CoverageSignup> findByCoverageRequest_Id(Long coverageRequestId);

    List<CoverageSignup> findByCoverageRequest_IdAndStatus(Long coverageRequestId, String status);

    /** All signups on a given day in a given status — used by the materialiser to place coverers. */
    List<CoverageSignup> findByDateAndStatus(LocalDate date, String status);

    /** Signups across a range in a given status — preloaded by the materialiser (grouped per day). */
    List<CoverageSignup> findByDateBetweenAndStatus(LocalDate from, LocalDate to, String status);

    long countByCoverageRequest_IdAndDateAndStatus(Long coverageRequestId, LocalDate date, String status);
}
