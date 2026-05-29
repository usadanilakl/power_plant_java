package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pwa.PwaSdsAuditDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.sds.SdsAuditRecordDto;
import com.dk_power.power_plant_java.entities.sds.SdsAuditRecord;
import com.dk_power.power_plant_java.mappers.sds.SdsAuditRecordMapper;
import com.dk_power.power_plant_java.repository.sds.SdsAuditRecordRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsAuditRecordSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaSdsAuditService {

    private final SdsAuditRecordRepo repo;
    private final SdsAuditRecordMapper mapper;
    private final SdsAuditRecordSharePointAdapter spAdapter;

    @Transactional
    public PwaSubmissionResult submitAudit(PwaSdsAuditDto dto) {
        Optional<SdsAuditRecord> existing = repo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
        if (existing.isPresent()) {
            log.info("[PWA SDS Audit] Duplicate for localUuid={}", dto.getLocalUuid());
            return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
        }

        SdsAuditRecord entity = new SdsAuditRecord();
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setChemicalSharepointId(dto.getChemicalSharepointId());
        entity.setChemicalLocalUuid(dto.getChemicalLocalUuid());
        entity.setChemicalName(dto.getChemicalName());
        entity.setAction(dto.getAction());
        entity.setOldSnapshot(dto.getOldSnapshot());
        entity.setAuditedByName(dto.getAuditedByName());
        entity.setAuditedByEmail(dto.getAuditedByEmail());
        entity.setComments(dto.getComments());
        entity.setCampaign(dto.getCampaign());
        entity.setAuditedAt(Instant.now());

        entity = repo.saveAndFlush(entity);
        log.info("[PWA SDS Audit] Saved locally: id={}, chemical={}, action={}, campaign={}",
                entity.getId(), dto.getChemicalName(), dto.getAction(), dto.getCampaign());

        String sharepointId = null;
        String method = "local";
        try {
            SdsAuditRecordDto spDto = mapper.convertToDto(entity);
            sharepointId = spAdapter.create(spDto);
            if (sharepointId != null) {
                entity.setSharepointId(sharepointId);
                repo.save(entity);
                method = "sharepoint";
            }
        } catch (Exception e) {
            log.warn("[PWA SDS Audit] SP submission failed, saved locally only: {}", e.getMessage());
        }

        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    public List<SdsAuditRecordDto> getByCampaign(String campaign) {
        return mapper.convertToDtos(repo.findByCampaignOrderByAuditedAtDesc(campaign));
    }

    public List<String> getAuditedChemicalUuids(String campaign) {
        return repo.findAuditedChemicalUuids(campaign);
    }
}
