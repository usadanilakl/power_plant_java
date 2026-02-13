package com.dk_power.power_plant_java.repository.hub;

import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
public interface HubClientInfoRepository extends JpaRepository<HubClientInfo, String> {

    List<HubClientInfo> findByLastSeenAfter(Instant cutoff);

    List<HubClientInfo> findByStatus(HubClientInfo.ClientStatus status);
}
