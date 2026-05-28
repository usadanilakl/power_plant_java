package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.sds.NgSdsChemicalService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsChemicalSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.PermitAttachmentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class SdsChemicalSharePointSyncable implements SharePointSyncable<SdsChemicalDto> {

    private final SdsChemicalSharePointAdapter adapter;
    private final SdsChemicalRepo repo;
    private final SdsChemicalMapper mapper;
    private final NgValueService valueService;
    private final SharePointFieldMergeService fieldMergeService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;

    private static final String ENTITY_TYPE = "SdsChemical";
    private static final String LIST_TITLE = "SDS";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("names", "Names"),
        Map.entry("locations", "Locations"),
        Map.entry("status", "Status"),
        Map.entry("bookNumber", "BookNumber"),
        Map.entry("sectionNumber", "Section"),
        Map.entry("notes", "Notes"),
        Map.entry("processedByName", "ProcessedByName"),
        Map.entry("processedByEmail", "ProcessedByEmail"),
        Map.entry("submitterName", "SubmitterName"),
        Map.entry("submitterEmail", "SubmitterEmail"),
        Map.entry("submitterPhone", "SubmitterPhone"),
        Map.entry("localUuid", "PwaId")
    );

    @Override public String getEntityTypeName() { return ENTITY_TYPE; }
    @Override public String getSharePointListTitle() { return LIST_TITLE; }
    @Override public List<SdsChemicalDto> fetchAllFromSharePoint() { return adapter.getAll(); }
    @Override public List<SdsChemicalDto> fetchModifiedSince(Instant since) { return adapter.getModifiedSince(since); }
    @Override public long getSyncIntervalMs() { return 60_000; }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(SdsChemicalDto remote, SyncResult result) {
        if (remote.getSharepointId() == null || remote.getSharepointId().isEmpty()) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        SdsChemical existing = repo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);
        if (existing == null && remote.getLocalUuid() != null && !remote.getLocalUuid().isEmpty()) {
            existing = repo.findFirstByLocalUuidOrderByIdAsc(remote.getLocalUuid()).orElse(null);
            if (existing != null) {
                existing.setSharepointId(spId);
                repo.save(existing);
                log.info("[SDS-Sync] Bound localUuid={} to spId={}", remote.getLocalUuid(), spId);
            }
        }

        if (existing == null) {
            SdsChemical entity = mapper.convertToEntity(remote);
            entity.setSharepointId(spId);
            entity.setSpModifiedTime(spModified);
            repo.save(entity);
            result.incrementCreated();
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            syncAttachmentsSafely(entity.getId(), spId);
            return EntitySyncOutcome.CREATED;
        }

        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);
        if (fieldsToApply.isEmpty()) {
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.SKIPPED;
        }

        applySelectiveFields(existing, remote, fieldsToApply);
        existing.setSpModifiedTime(spModified);
        repo.save(existing);
        result.incrementUpdated();
        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        syncAttachmentsSafely(existing.getId(), spId);
        return EntitySyncOutcome.UPDATED;
    }

    @Override public String getSharepointId(SdsChemicalDto dto) { return dto.getSharepointId(); }
    @Override public boolean supportsAutoClose() { return false; }
    @Override public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {}
    @Override public void mergeIfDuplicatesExist() {}
    @Override public Map<String, String> getFieldMapping() { return FIELD_MAPPING; }

    @Override
    public Map<String, String> extractSpFieldValues(SdsChemicalDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Names", dto.getNames());
        values.put("Locations", dto.getLocations());
        values.put("Status", dto.getStatusName());
        values.put("BookNumber", dto.getBookNumber() != null ? dto.getBookNumber().toString() : null);
        values.put("Section", dto.getSectionNumber() != null ? dto.getSectionNumber().toString() : null);
        values.put("Notes", dto.getNotes());
        values.put("ProcessedByName", dto.getProcessedByName());
        values.put("ProcessedByEmail", dto.getProcessedByEmail());
        values.put("SubmitterName", dto.getSubmitterName());
        values.put("SubmitterEmail", dto.getSubmitterEmail());
        values.put("SubmitterPhone", dto.getSubmitterPhone());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override public Instant getSpModifiedTime(SdsChemicalDto dto) { return dto.getSpModifiedTime(); }

    @Override
    public void applySelectiveFields(Object entityObj, SdsChemicalDto dto, Set<String> fields) {
        SdsChemical entity = (SdsChemical) entityObj;
        if (fields.contains("names")) entity.setNames(dto.getNames());
        if (fields.contains("locations")) entity.setLocations(dto.getLocations());
        if (fields.contains("status") && dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue(NgSdsChemicalService.STATUS_CATEGORY, dto.getStatusName()));
        }
        if (fields.contains("bookNumber")) entity.setBookNumber(dto.getBookNumber());
        if (fields.contains("sectionNumber")) entity.setSectionNumber(dto.getSectionNumber());
        if (fields.contains("notes")) entity.setNotes(dto.getNotes());
        if (fields.contains("processedByName")) entity.setProcessedByName(dto.getProcessedByName());
        if (fields.contains("processedByEmail")) entity.setProcessedByEmail(dto.getProcessedByEmail());
        if (fields.contains("submitterName")) entity.setSubmitterName(dto.getSubmitterName());
        if (fields.contains("submitterEmail")) entity.setSubmitterEmail(dto.getSubmitterEmail());
        if (fields.contains("submitterPhone")) entity.setSubmitterPhone(dto.getSubmitterPhone());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        entity.setSharepointId(dto.getSharepointId());
    }

    private void syncAttachmentsSafely(Long entityId, String sharepointId) {
        try {
            permitAttachmentSyncService.syncAttachmentsForSdsChemical(entityId, sharepointId);
        } catch (Exception e) {
            log.warn("[SDS Syncable] Attachment sync failed for spId={}: {}", sharepointId, e.getMessage());
        }
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return repo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(SdsChemical::getId)
            .orElse(null);
    }
}
