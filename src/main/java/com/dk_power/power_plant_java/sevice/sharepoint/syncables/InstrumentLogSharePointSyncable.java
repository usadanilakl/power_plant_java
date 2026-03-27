package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.instrumentation.InstrumentLogDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentLogMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentLogRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InstrumentLogSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.InstrumentLogMergeService;
import com.dk_power.power_plant_java.sevice.sync.PermitAttachmentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class InstrumentLogSharePointSyncable implements SharePointSyncable<InstrumentLogDto> {

    private final InstrumentLogSharePointAdapter logAdapter;
    private final InstrumentLogRepo instrumentLogRepo;
    private final InstrumentLogMapper logMapper;
    private final InstrumentLogMergeService instrumentLogMergeService;
    private final SharePointFieldMergeService fieldMergeService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;
    private final TransactionTemplate transactionTemplate;

    private static final String ENTITY_TYPE = "InstrumentLog";
    private static final String LIST_TITLE = "Instrumentation Log";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("instrumentTagNumber", "Tag_x0020_Number"),
        Map.entry("instrumentDescription", "Description"),
        Map.entry("status", "Status"),
        Map.entry("date", "Date"),
        Map.entry("time", "Time"),
        Map.entry("name", "Name"),
        Map.entry("comment", "Comment"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<InstrumentLogDto> fetchAllFromSharePoint() {
        return logAdapter.getAll();
    }

    @Override
    public EntitySyncOutcome processRemoteItem(InstrumentLogDto remote, SyncResult result) {
        if (remote.getSharepointId() == null || remote.getSharepointId().isEmpty()) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);
        InstrumentLogSyncDecision decision = transactionTemplate.execute(status ->
            processRemoteItemInTransaction(remote, result, spId, spValues, spModified));

        if (decision == null) {
            result.incrementFailed();
            return EntitySyncOutcome.SKIPPED;
        }

        if (decision.shouldSyncAttachments()) {
            syncAttachmentsSafely(decision.entityId(), spId);
        }

        return decision.outcome();
    }

    @Override
    public String getSharepointId(InstrumentLogDto dto) {
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
        instrumentLogMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(InstrumentLogDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Tag_x0020_Number", dto.getInstrumentTagNumber());
        values.put("Description", dto.getInstrumentDescription());
        values.put("Status", dto.getStatus());
        values.put("Date", dto.getDate());
        values.put("Time", dto.getTime());
        values.put("Name", dto.getName());
        values.put("Comment", dto.getComment());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(InstrumentLogDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, InstrumentLogDto dto, Set<String> fields) {
        InstrumentLog entity = (InstrumentLog) entityObj;
        if (fields.contains("instrumentTagNumber")) entity.setInstrumentTagNumber(dto.getInstrumentTagNumber());
        if (fields.contains("instrumentDescription")) entity.setInstrumentDescription(dto.getInstrumentDescription());
        if (fields.contains("status")) entity.setStatus(dto.getStatus());
        if (fields.contains("date")) entity.setDate(dto.getDate());
        if (fields.contains("time")) entity.setTime(dto.getTime());
        if (fields.contains("name")) entity.setName(dto.getName());
        if (fields.contains("comment")) entity.setComment(dto.getComment());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        entity.setSharepointId(dto.getSharepointId());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return instrumentLogRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(InstrumentLog::getId)
            .orElse(null);
    }

    private void syncAttachmentsSafely(Long entityId, String sharepointId) {
        try {
            permitAttachmentSyncService.syncAttachmentsForInstrumentLog(entityId, sharepointId);
        } catch (Exception e) {
            log.warn("[InstrumentLog Syncable] Attachment sync failed for spId={}: {}",
                sharepointId, e.getMessage());
        }
    }

    @Transactional
    protected InstrumentLogSyncDecision processRemoteItemInTransaction(
        InstrumentLogDto remote,
        SyncResult result,
        String spId,
        Map<String, String> spValues,
        Instant spModified
    ) {
        InstrumentLog existing = instrumentLogRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);
        if (existing == null && remote.getLocalUuid() != null && !remote.getLocalUuid().isBlank()) {
            existing = instrumentLogRepo.findFirstByLocalUuidOrderByIdAsc(remote.getLocalUuid()).orElse(null);
            if (existing != null) {
                existing.setSharepointId(spId);
                instrumentLogRepo.save(existing);
            }
        }
        if (existing == null) {
            InstrumentLog entity = logMapper.fromSharePointDto(remote);
            instrumentLogRepo.save(entity);
            result.incrementCreated();
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return new InstrumentLogSyncDecision(EntitySyncOutcome.CREATED, entity.getId(), true);
        }

        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return new InstrumentLogSyncDecision(EntitySyncOutcome.SKIPPED, existing.getId(), true);
        }

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);
        if (fieldsToApply.isEmpty()) {
            return new InstrumentLogSyncDecision(EntitySyncOutcome.SKIPPED, existing.getId(), true);
        }

        applySelectiveFields(existing, remote, fieldsToApply);
        instrumentLogRepo.save(existing);
        result.incrementUpdated();
        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return new InstrumentLogSyncDecision(EntitySyncOutcome.UPDATED, existing.getId(), true);
    }

    private record InstrumentLogSyncDecision(EntitySyncOutcome outcome, Long entityId, boolean shouldSyncAttachments) {
    }
}
