package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.InstrumentMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class InstrumentSharePointSyncable implements SharePointSyncable<InstrumentDto> {

    private final InstrumentSharePointAdapter instrumentAdapter;
    private final InstrumentRepo instrumentRepo;
    private final InstrumentMapper instrumentMapper;
    private final InstrumentMergeService instrumentMergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "Instrument";
    private static final String LIST_TITLE = "Instrumentation";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("tagNumber", "Tag_x0020_Number"),
        Map.entry("description", "Description"),
        Map.entry("vendor", "Vendor"),
        Map.entry("location", "Location"),
        Map.entry("type", "Type"),
        Map.entry("currentStatus", "CurrentStatus"),
        Map.entry("lastUpdatedDate", "LastUpdatedDate"),
        Map.entry("lastUpdatedTime", "LastUpdatedTime"),
        Map.entry("lastUpdatedBy", "LastUpdatedBy"),
        Map.entry("lastComment", "LastComment"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<InstrumentDto> fetchAllFromSharePoint() {
        return instrumentAdapter.getAll();
    }

    @Override
    public List<InstrumentDto> fetchModifiedSince(Instant since) {
        return instrumentAdapter.getModifiedSince(since);
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(InstrumentDto remote, SyncResult result) {
        if (remote.getSharepointId() == null || remote.getSharepointId().isEmpty()) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        Instrument existing = instrumentRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);
        if (existing == null) {
            Instrument entity = instrumentMapper.fromSharePointDto(remote);
            instrumentRepo.save(entity);
            result.incrementCreated();
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
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
        instrumentRepo.save(existing);
        result.incrementUpdated();
        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(InstrumentDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // no-op
    }

    @Override
    public void mergeIfDuplicatesExist() {
        instrumentMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(InstrumentDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Tag_x0020_Number", dto.getTagNumber());
        values.put("Description", dto.getDescription());
        values.put("Vendor", dto.getVendor());
        values.put("Location", dto.getLocation());
        values.put("Type", dto.getType());
        values.put("CurrentStatus", dto.getCurrentStatus());
        values.put("LastUpdatedDate", dto.getLastUpdatedDate());
        values.put("LastUpdatedTime", dto.getLastUpdatedTime());
        values.put("LastUpdatedBy", dto.getLastUpdatedBy());
        values.put("LastComment", dto.getLastComment());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(InstrumentDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, InstrumentDto dto, Set<String> fields) {
        Instrument entity = (Instrument) entityObj;
        if (fields.contains("tagNumber")) entity.setTagNumber(dto.getTagNumber());
        if (fields.contains("description")) entity.setDescription(dto.getDescription());
        if (fields.contains("vendor")) entity.setVendor(dto.getVendor());
        if (fields.contains("location")) entity.setLocation(dto.getLocation());
        if (fields.contains("type")) entity.setType(dto.getType());
        if (fields.contains("currentStatus")) entity.setCurrentStatus(dto.getCurrentStatus());
        if (fields.contains("lastUpdatedDate")) entity.setLastUpdatedDate(dto.getLastUpdatedDate());
        if (fields.contains("lastUpdatedTime")) entity.setLastUpdatedTime(dto.getLastUpdatedTime());
        if (fields.contains("lastUpdatedBy")) entity.setLastUpdatedBy(dto.getLastUpdatedBy());
        if (fields.contains("lastComment")) entity.setLastComment(dto.getLastComment());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        entity.setSharepointId(dto.getSharepointId());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return instrumentRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(Instrument::getId)
            .orElse(null);
    }
}

