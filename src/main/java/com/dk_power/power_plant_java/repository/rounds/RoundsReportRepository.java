package com.dk_power.power_plant_java.repository.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundsReport;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link RoundsReport}. Extends {@link BaseRepository} so the
 * entity plugs into the sync infrastructure (date-modified queries, etc.).
 */
public interface RoundsReportRepository extends BaseRepository<RoundsReport> {

    /** Most recently inserted report (id is device-prefixed but monotonic per device). */
    Optional<RoundsReport> findTopByOrderByIdDesc();

    /** True if a report with this content hash is already stored. */
    boolean existsByContentHash(String contentHash);

    /** Up to 50 most recent reports, newest first. */
    List<RoundsReport> findTop50ByOrderByIdDesc();
}
