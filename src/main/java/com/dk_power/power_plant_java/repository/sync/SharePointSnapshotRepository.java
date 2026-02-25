package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.SharePointSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SharePointSnapshotRepository extends JpaRepository<SharePointSnapshot, Long> {

    Optional<SharePointSnapshot> findByEntityTypeAndSharepointId(String entityType, String sharepointId);

    void deleteByEntityTypeAndSharepointId(String entityType, String sharepointId);
}
