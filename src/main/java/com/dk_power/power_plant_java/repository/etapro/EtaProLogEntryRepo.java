package com.dk_power.power_plant_java.repository.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProLogEntry;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface EtaProLogEntryRepo extends BaseRepository<EtaProLogEntry> {

    /** Dedup check — true if an entry with this composite-key hash already exists. */
    boolean existsByDedupKey(String dedupKey);

    /** Incremental-pull watermark: the newest Create Time we've already imported (null if empty). */
    @Query("SELECT MAX(e.createTime) FROM EtaProLogEntry e")
    LocalDateTime findMaxCreateTime();

    Page<EtaProLogEntry> findAllByOrderByCreateTimeDesc(Pageable pageable);

    Page<EtaProLogEntry> findByCreateTimeBetweenOrderByCreateTimeDesc(
            LocalDateTime start, LocalDateTime end, Pageable pageable);

    List<EtaProLogEntry> findByScrapeSessionId(String sessionId);
}
