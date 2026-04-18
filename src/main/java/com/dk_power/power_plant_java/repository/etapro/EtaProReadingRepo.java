package com.dk_power.power_plant_java.repository.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EtaProReadingRepo extends BaseRepository<EtaProReading> {
    List<EtaProReading> findByPointIdAndReadingTimeBetweenOrderByReadingTimeAsc(
            String pointId, LocalDateTime start, LocalDateTime end);

    /** Descending order — for scanning recent events first. */
    List<EtaProReading> findByPointIdAndReadingTimeBetweenOrderByReadingTimeDesc(
            String pointId, LocalDateTime start, LocalDateTime end);

    /** Projection: only pointId, readingTime, readingValue — avoids loading quality/session columns. */
    @Query("SELECT r FROM EtaProReading r WHERE r.pointId = :pointId " +
           "AND r.readingTime BETWEEN :start AND :end ORDER BY r.readingTime ASC")
    List<EtaProReading> findReadingsForAnalysis(
            @Param("pointId") String pointId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    Page<EtaProReading> findByPointIdOrderByReadingTimeDesc(String pointId, Pageable pageable);

    Page<EtaProReading> findByReadingTimeBetweenOrderByReadingTimeDesc(
            LocalDateTime start, LocalDateTime end, Pageable pageable);

    List<EtaProReading> findByScrapeSessionId(String sessionId);

    @Query("SELECT r FROM EtaProReading r WHERE r.id IN " +
            "(SELECT MAX(r2.id) FROM EtaProReading r2 GROUP BY r2.pointId)")
    List<EtaProReading> findLatestPerPoint();

    boolean existsByPointIdAndReadingTime(String pointId, LocalDateTime readingTime);

    long countByScrapeSessionId(String sessionId);

    void deleteByScrapeSessionId(String sessionId);
}
