package com.dk_power.power_plant_java.repository.hub;

import com.dk_power.power_plant_java.entities.hub.HubStoredBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HubStoredBackupRepository extends JpaRepository<HubStoredBackup, Long> {

    Optional<HubStoredBackup> findByChecksum(String checksum);

    Optional<HubStoredBackup> findTopByOrderByUploadedAtDesc();

    @Query(value = "SELECT * FROM hub_stored_backups ORDER BY uploaded_at DESC OFFSET :keepCount", nativeQuery = true)
    List<HubStoredBackup> findOldBackups(@Param("keepCount") int keepCount);
}
