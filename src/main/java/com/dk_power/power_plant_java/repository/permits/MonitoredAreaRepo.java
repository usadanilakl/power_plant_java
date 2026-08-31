package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.MonitoredArea;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface MonitoredAreaRepo extends BaseRepository<MonitoredArea> {

    /**
     * The entry a permit already produced, if any — including one that was manually removed, so the
     * regeneration sweep can see that decision instead of creating a duplicate.
     */
    Optional<MonitoredArea> findFirstBySourceTypeAndSourcePermitId(String sourceType, Long sourcePermitId);

    /**
     * Every entry derived from one permit, oldest id first.
     *
     * <p>There can legitimately be more than one: ids are device-prefixed, so two nodes that derive
     * the same permit while partitioned each mint their own row and sync keeps both. The smallest id
     * is the deterministic survivor — the same rule the Category/Value dedup uses, so every node
     * independently picks the same winner.
     */
    List<MonitoredArea> findBySourceTypeAndSourcePermitIdOrderByIdAsc(String sourceType, Long sourcePermitId);

    List<MonitoredArea> findByRequiresMonitoringTrue();
}
