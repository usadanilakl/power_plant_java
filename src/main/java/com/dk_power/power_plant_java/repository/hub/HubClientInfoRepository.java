package com.dk_power.power_plant_java.repository.hub;

import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
public interface HubClientInfoRepository extends JpaRepository<HubClientInfo, String> {

    List<HubClientInfo> findByLastSeenAfter(Instant cutoff);

    List<HubClientInfo> findByStatus(HubClientInfo.ClientStatus status);

    @Modifying
    @Query("UPDATE HubClientInfo c SET c.status = :offlineStatus WHERE c.status = :onlineStatus AND c.lastSeen < :cutoff")
    int markClientsOfflineBefore(@Param("cutoff") Instant cutoff,
                                 @Param("onlineStatus") HubClientInfo.ClientStatus onlineStatus,
                                 @Param("offlineStatus") HubClientInfo.ClientStatus offlineStatus);
}
