package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.Peer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PeerRepository extends JpaRepository<Peer, String> {

    List<Peer> findByStatus(Peer.PeerStatus status);

    @Query("SELECT p FROM Peer p WHERE p.lastSeen > :since AND p.machineId != :excludeId")
    List<Peer> findActivePeers(@Param("since") Instant since, @Param("excludeId") String excludeId);

    List<Peer> findByMachineIdNot(String machineId);

    @Query("SELECT p FROM Peer p WHERE p.status IN ('ONLINE', 'SYNCING') AND p.machineId != :excludeId")
    List<Peer> findOnlinePeers(@Param("excludeId") String excludeId);

    // Find peers that haven't been seen recently
    @Query("SELECT p FROM Peer p WHERE p.lastSeen < :cutoff")
    List<Peer> findStalePeers(@Param("cutoff") Instant cutoff);
}
