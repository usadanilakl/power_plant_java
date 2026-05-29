package com.dk_power.power_plant_java.repository.sds;

import com.dk_power.power_plant_java.entities.sds.SdsAuditRecord;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SdsAuditRecordRepo extends BaseRepository<SdsAuditRecord> {
    Optional<SdsAuditRecord> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<SdsAuditRecord> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    List<SdsAuditRecord> findByCampaignOrderByAuditedAtDesc(String campaign);
    List<SdsAuditRecord> findByChemicalLocalUuidOrderByAuditedAtDesc(String chemicalLocalUuid);
    List<SdsAuditRecord> findBySharepointIdIsNull();
    boolean existsBySharepointId(String sharepointId);

    @Query("select distinct a.campaign from SdsAuditRecord a where a.campaign is not null order by a.campaign desc")
    List<String> findDistinctCampaigns();

    @Query("select distinct a.chemicalLocalUuid from SdsAuditRecord a where a.campaign = ?1 and a.chemicalLocalUuid is not null")
    List<String> findAuditedChemicalUuids(String campaign);
}
