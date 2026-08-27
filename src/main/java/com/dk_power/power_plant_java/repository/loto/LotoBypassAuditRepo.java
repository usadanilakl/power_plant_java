package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.LotoBypassAudit;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LotoBypassAuditRepo extends BaseRepository<LotoBypassAudit> {

    /** Audit timeline for one LOTO, newest first. */
    @Query("SELECT a FROM LotoBypassAudit a WHERE a.lotoId = ?1 ORDER BY a.atTime DESC")
    List<LotoBypassAudit> findByLotoIdNewestFirst(Long lotoId);

    /** Global timeline for admin views, newest first. */
    @Query("SELECT a FROM LotoBypassAudit a ORDER BY a.atTime DESC")
    List<LotoBypassAudit> findAllNewestFirst();
}
