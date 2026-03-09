package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.PermitAttachmentSyncService;
import com.dk_power.power_plant_java.sevice.sync.WorkRequestMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorkRequestSharePointSyncable implements SharePointSyncable<WorkRequestDto> {

    private final WorkRequestSharePointAdapter wrAdapter;
    private final WorkRequestRepo workRequestRepo;
    private final WorkRequestMapper workRequestMapper;
    private final NgValueService valueService;
    private final WorkRequestMergeService workRequestMergeService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "WorkRequest";
    private static final String LIST_TITLE = "Work Requests";

    /** Entity field name → SP column name. */
    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("workScope", "Title"),
        Map.entry("dateOfWorkToBePerformed", "DateOfWork"),
        Map.entry("timeOfWorkToBePerformed", "DateOfWork"),
        Map.entry("requestedBy", "WorkRequestedBy"),
        Map.entry("company", "Company"),
        Map.entry("location", "LocationOfWork"),
        Map.entry("affectedEquipment", "AffectedEquipment"),
        Map.entry("isLotoRequired", "IsLOTORequired"),
        Map.entry("isHotWorkRequired", "IsHotWorkRequired"),
        Map.entry("isConfinedSpaceEntryRequired", "IsConfinedSpaceEntryRequired"),
        Map.entry("foreman", "ForemanName"),
        Map.entry("fireWatch", "FireWatchName"),
        Map.entry("space", "SpaceToBeEntered"),
        Map.entry("status", "Status"),
        Map.entry("submitterName", "SubmitterName"),
        Map.entry("submitterEmail", "SubmitterEmail"),
        Map.entry("submitterPhone", "SubmitterPhone"),
        Map.entry("submitterCompany", "SubmitterCompany"),
        Map.entry("timeSubmitted", "TimeSubmitted"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<WorkRequestDto> fetchAllFromSharePoint() {
        return wrAdapter.getAll();
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(WorkRequestDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        WorkRequest existing = workRequestRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            // New — create with all fields
            WorkRequest entity = workRequestMapper.fromSharePointDto(remote);
            String remoteStatus = remote.getStatus() != null ? remote.getStatus() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            workRequestRepo.save(entity);
            result.incrementCreated();
            log.debug("[WR Syncable] Created: spId={}", spId);

            // Sync attachments for new entity
            try {
                permitAttachmentSyncService.syncAttachmentsForWorkRequest(entity.getId(), spId);
            } catch (Exception e) {
                log.warn("[WR Syncable] Attachment sync failed for spId={}: {}", spId, e.getMessage());
            }

            // Save initial snapshot
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Existing — field-level merge
        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            syncAttachmentsSafely(existing.getId(), spId);
            return EntitySyncOutcome.SKIPPED;
        }

        log.info("[WR Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            // Don't update snapshot here — if we do, the SP change is permanently
            // lost from diff detection. Leave snapshot stale so next sync re-evaluates.
            log.info("[WR Syncable] spId={}: local wins ALL fields — entity unchanged, will re-check next sync", spId);
            syncAttachmentsSafely(existing.getId(), spId);
            return EntitySyncOutcome.SKIPPED;
        }

        log.info("[WR Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        // Handle status change via NgValue
        if (fieldsToApply.contains("status")) {
            String remoteStatus = remote.getStatus() != null ? remote.getStatus() : "Active";
            existing.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
        }

        workRequestRepo.save(existing);
        syncAttachmentsSafely(existing.getId(), spId);
        result.incrementUpdated();
        log.info("[WR Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        // Always update snapshot with current SP values
        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(WorkRequestDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return true; }

    @Override
    @Transactional
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        List<WorkRequest> localActive = workRequestRepo.findByPermitStatus_NameIgnoreCase("Active");
        for (WorkRequest local : localActive) {
            String spId = local.getSharepointId();
            if (spId != null && !remoteSharepointIds.contains(spId.toLowerCase())) {
                try {
                    local.setPermitStatus(valueService.createValue("Permit Status", "Closed"));
                    workRequestRepo.save(local);
                    result.incrementAutoClosed();
                    log.debug("[WR Syncable] Auto-closed spId={}", spId);
                } catch (Exception e) {
                    result.incrementFailed();
                    log.error("[WR Syncable] Auto-close failed for spId={}: {}", spId, e.getMessage(), e);
                }
            }
        }
    }

    @Override
    public void mergeIfDuplicatesExist() {
        workRequestMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(WorkRequestDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getWorkScope());
        values.put("DateOfWork", dto.getDateOfWorkToBePerformed());
        values.put("WorkRequestedBy", dto.getRequestedBy());
        values.put("Company", dto.getCompany());
        values.put("LocationOfWork", dto.getLocation());
        values.put("AffectedEquipment", dto.getAffectedEquipment());
        values.put("IsLOTORequired", dto.getIsLotoRequired() != null ? dto.getIsLotoRequired().toString() : null);
        values.put("IsHotWorkRequired", dto.getIsHotWorkRequired() != null ? dto.getIsHotWorkRequired().toString() : null);
        values.put("IsConfinedSpaceEntryRequired", dto.getIsConfinedSpaceEntryRequired() != null ? dto.getIsConfinedSpaceEntryRequired().toString() : null);
        values.put("ForemanName", dto.getForeman());
        values.put("FireWatchName", dto.getFireWatch());
        values.put("SpaceToBeEntered", dto.getSpace());
        values.put("Status", dto.getStatus());
        values.put("SubmitterName", dto.getSubmitterName());
        values.put("SubmitterEmail", dto.getSubmitterEmail());
        values.put("SubmitterPhone", dto.getSubmitterPhone());
        values.put("SubmitterCompany", dto.getSubmitterCompany());
        values.put("TimeSubmitted", dto.getTimeSubmitted());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(WorkRequestDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, WorkRequestDto dto, Set<String> fields) {
        WorkRequest entity = (WorkRequest) entityObj;
        if (fields.contains("workScope")) entity.setWorkScope(dto.getWorkScope());
        if (fields.contains("dateOfWorkToBePerformed")) entity.setDateOfWorkToBePerformed(dto.getDateOfWorkToBePerformed());
        if (fields.contains("timeOfWorkToBePerformed")) entity.setTimeOfWorkToBePerformed(dto.getTimeOfWorkToBePerformed());
        if (fields.contains("requestedBy")) entity.setRequestedBy(dto.getRequestedBy());
        if (fields.contains("company")) entity.setCompany(dto.getCompany());
        if (fields.contains("location")) entity.setLocation(dto.getLocation());
        if (fields.contains("affectedEquipment")) entity.setAffectedEquipment(dto.getAffectedEquipment());
        if (fields.contains("isLotoRequired")) entity.setIsLotoRequired(dto.getIsLotoRequired());
        if (fields.contains("isHotWorkRequired")) entity.setIsHotWorkRequired(dto.getIsHotWorkRequired());
        if (fields.contains("isConfinedSpaceEntryRequired")) entity.setIsConfinedSpaceEntryRequired(dto.getIsConfinedSpaceEntryRequired());
        if (fields.contains("foreman")) entity.setForeman(dto.getForeman());
        if (fields.contains("fireWatch")) entity.setFireWatch(dto.getFireWatch());
        if (fields.contains("space")) entity.setSpace(dto.getSpace());
        if (fields.contains("submitterName")) entity.setSubmitterName(dto.getSubmitterName());
        if (fields.contains("submitterEmail")) entity.setSubmitterEmail(dto.getSubmitterEmail());
        if (fields.contains("submitterPhone")) entity.setSubmitterPhone(dto.getSubmitterPhone());
        if (fields.contains("submitterCompany")) entity.setSubmitterCompany(dto.getSubmitterCompany());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        if (fields.contains("timeSubmitted")) entity.setTimeSubmitted(dto.getTimeSubmitted());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return workRequestRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(WorkRequest::getId)
            .orElse(null);
    }

    private void syncAttachmentsSafely(Long entityId, String sharepointId) {
        try {
            permitAttachmentSyncService.syncAttachmentsForWorkRequest(entityId, sharepointId);
        } catch (Exception e) {
            log.warn("[WR Syncable] Attachment sync failed for spId={}: {}", sharepointId, e.getMessage());
        }
    }
}


