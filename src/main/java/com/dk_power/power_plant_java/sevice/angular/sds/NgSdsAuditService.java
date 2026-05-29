package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.dto.sds.SdsAuditRecordDto;
import com.dk_power.power_plant_java.entities.sds.SdsAuditRecord;
import com.dk_power.power_plant_java.mappers.sds.SdsAuditRecordMapper;
import com.dk_power.power_plant_java.repository.sds.SdsAuditRecordRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class NgSdsAuditService {

    public static final String CAMPAIGN_CATEGORY = "SdsAuditCampaign";

    private final SdsAuditRecordRepo repo;
    private final SdsAuditRecordMapper mapper;
    private final NgValueService valueService;

    public List<SdsAuditRecordDto> getAll() {
        return mapper.convertToDtos(repo.findAll());
    }

    public List<SdsAuditRecordDto> getByCampaign(String campaign) {
        return mapper.convertToDtos(repo.findByCampaignOrderByAuditedAtDesc(campaign));
    }

    public List<SdsAuditRecordDto> getByChemical(String chemicalLocalUuid) {
        return mapper.convertToDtos(repo.findByChemicalLocalUuidOrderByAuditedAtDesc(chemicalLocalUuid));
    }

    /** Distinct chemical localUuids already audited in a campaign — used to compute the 'due' list. */
    public List<String> getAuditedChemicalUuids(String campaign) {
        return repo.findAuditedChemicalUuids(campaign);
    }

    /** Campaign labels: admin-managed Values (category SdsAuditCampaign) merged with ones already used. */
    public List<String> getCampaigns() {
        Set<String> campaigns = new LinkedHashSet<>();
        try {
            valueService.getValuesByCategory(CAMPAIGN_CATEGORY).forEach(v -> campaigns.add(v.getName()));
        } catch (Exception ignored) { /* category may not exist yet */ }
        campaigns.addAll(repo.findDistinctCampaigns());
        return new ArrayList<>(campaigns);
    }

    public SdsAuditRecordDto record(SdsAuditRecordDto dto) {
        SdsAuditRecord entity = mapper.convertToEntity(dto);
        if (entity.getAuditedAt() == null) entity.setAuditedAt(Instant.now());
        if (entity.getLocalUuid() == null || entity.getLocalUuid().isBlank()) {
            entity.setLocalUuid(UUID.randomUUID().toString());
        }
        entity = repo.save(entity);
        return mapper.convertToDto(entity);
    }
}
