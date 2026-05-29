package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.sds.SdsAuditRecordDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.sds.SdsAuditRecord;
import com.dk_power.power_plant_java.mappers.sds.SdsAuditRecordMapper;
import com.dk_power.power_plant_java.repository.sds.SdsAuditRecordRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsAuditRecordSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Pulls audit records from the "SDS Audit" list. Records are append-only/immutable, so the merge is
 * create-if-absent (bound by sharepointId, then localUuid) — no field updates.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SdsAuditRecordSharePointSyncable implements SharePointSyncable<SdsAuditRecordDto> {

    private final SdsAuditRecordSharePointAdapter adapter;
    private final SdsAuditRecordRepo repo;
    private final SdsAuditRecordMapper mapper;

    private static final String ENTITY_TYPE = "SdsAuditRecord";
    private static final String LIST_TITLE = "SDS Audit";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("chemicalSharepointId", "ChemicalSpId"),
        Map.entry("chemicalLocalUuid", "ChemicalLocalUuid"),
        Map.entry("chemicalName", "ChemicalName"),
        Map.entry("action", "Action"),
        Map.entry("oldSnapshot", "OldSnapshot"),
        Map.entry("auditedByName", "AuditedByName"),
        Map.entry("auditedByEmail", "AuditedByEmail"),
        Map.entry("comments", "Comments"),
        Map.entry("campaign", "Campaign"),
        Map.entry("localUuid", "PwaId")
    );

    @Override public String getEntityTypeName() { return ENTITY_TYPE; }
    @Override public String getSharePointListTitle() { return LIST_TITLE; }
    @Override public java.util.List<SdsAuditRecordDto> fetchAllFromSharePoint() { return adapter.getAll(); }
    @Override public java.util.List<SdsAuditRecordDto> fetchModifiedSince(Instant since) { return adapter.getModifiedSince(since); }
    @Override public long getSyncIntervalMs() { return 60_000; }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(SdsAuditRecordDto remote, SyncResult result) {
        String spId = remote.getSharepointId();
        if (spId == null || spId.isEmpty()) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        if (repo.findFirstBySharepointIdOrderByIdAsc(spId).isPresent()) {
            return EntitySyncOutcome.SKIPPED; // immutable — already have it
        }

        if (remote.getLocalUuid() != null && !remote.getLocalUuid().isEmpty()) {
            SdsAuditRecord byUuid = repo.findFirstByLocalUuidOrderByIdAsc(remote.getLocalUuid()).orElse(null);
            if (byUuid != null) {
                byUuid.setSharepointId(spId);
                byUuid.setSpModifiedTime(remote.getSpModifiedTime());
                repo.save(byUuid);
                return EntitySyncOutcome.UPDATED;
            }
        }

        SdsAuditRecord entity = mapper.convertToEntity(remote);
        entity.setSharepointId(spId);
        entity.setSpModifiedTime(remote.getSpModifiedTime());
        repo.save(entity);
        result.incrementCreated();
        return EntitySyncOutcome.CREATED;
    }

    @Override public String getSharepointId(SdsAuditRecordDto dto) { return dto.getSharepointId(); }
    @Override public boolean supportsAutoClose() { return false; }
    @Override public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {}
    @Override public void mergeIfDuplicatesExist() {}
    @Override public Map<String, String> getFieldMapping() { return FIELD_MAPPING; }

    @Override
    public Map<String, String> extractSpFieldValues(SdsAuditRecordDto dto) {
        Map<String, String> v = new LinkedHashMap<>();
        v.put("ChemicalSpId", dto.getChemicalSharepointId());
        v.put("ChemicalLocalUuid", dto.getChemicalLocalUuid());
        v.put("ChemicalName", dto.getChemicalName());
        v.put("Action", dto.getAction());
        v.put("OldSnapshot", dto.getOldSnapshot());
        v.put("AuditedByName", dto.getAuditedByName());
        v.put("AuditedByEmail", dto.getAuditedByEmail());
        v.put("Comments", dto.getComments());
        v.put("Campaign", dto.getCampaign());
        v.put("PwaId", dto.getLocalUuid());
        return v;
    }

    @Override public Instant getSpModifiedTime(SdsAuditRecordDto dto) { return dto.getSpModifiedTime(); }

    @Override
    public void applySelectiveFields(Object entityObj, SdsAuditRecordDto dto, Set<String> fields) {
        // Audit records are immutable; no selective field updates.
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return repo.findFirstBySharepointIdOrderByIdAsc(sharepointId).map(SdsAuditRecord::getId).orElse(null);
    }
}
