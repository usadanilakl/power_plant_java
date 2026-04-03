package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.PermitAttachmentSyncService;
import com.dk_power.power_plant_java.sevice.sync.WorkRequestMergeService;
import com.dk_power.power_plant_java.sevice.sync.WorkRequestSyncRepairService;
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
public class WorkRequestSharePointSyncable implements SharePointSyncable<WorkRequestDto> {

    private final WorkRequestSharePointAdapter wrAdapter;
    private final WorkRequestRepo workRequestRepo;
    private final WorkRequestMapper workRequestMapper;
    private final WorkAreaRepo workAreaRepo;
    private final NgValueService valueService;
    private final WorkRequestMergeService workRequestMergeService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;
    private final WorkRequestSyncRepairService workRequestSyncRepairService;
    private final SharePointFieldMergeService fieldMergeService;
    private final TransactionTemplate transactionTemplate;

    private static final String ENTITY_TYPE = "WorkRequest";
    private static final String LIST_TITLE = "Work Requests";

    /** Entity field name -> SP column name. */
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
        Map.entry("workCategory", "MainWorkScope"),
        Map.entry("workArea", "WorkAreaName"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public long getSyncIntervalMs() { return 30_000; } // 30 seconds — WRs need frequent polling

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<WorkRequestDto> fetchAllFromSharePoint() {
        return wrAdapter.getAll();
    }

    @Override
    public List<WorkRequestDto> fetchModifiedSince(Instant since) {
        return wrAdapter.getModifiedSince(since);
    }

    @Override
    public EntitySyncOutcome processRemoteItem(WorkRequestDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);
        WorkRequestSyncDecision decision = transactionTemplate.execute(status ->
            processRemoteItemInTransaction(remote, result, spId, spValues, spModified));

        if (decision == null) {
            result.incrementFailed();
            return EntitySyncOutcome.SKIPPED;
        }

        if (decision.shouldEnsureCreateHistory()) {
            workRequestSyncRepairService.ensureCreateHistoryIfMissing(decision.entityId());
        }

        if (decision.shouldSyncAttachments()) {
            syncAttachmentsSafely(decision.entityId(), spId);
        }

        return decision.outcome();
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
    public void afterSync(SyncResult result) {
        int repaired = workRequestSyncRepairService.backfillMissingCreateHistory();
        if (repaired > 0) {
            log.info("[WR Syncable] Repaired {} SharePoint-backed WR rows missing CREATE history", repaired);
        }
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
        values.put("MainWorkScope", dto.getWorkCategoryName());
        values.put("WorkAreaName", dto.getWorkAreaName());
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
        if (fields.contains("workScope")) setIfDifferent(entity::getWorkScope, entity::setWorkScope, dto.getWorkScope());
        if (fields.contains("dateOfWorkToBePerformed")) setIfDifferent(entity::getDateOfWorkToBePerformed, entity::setDateOfWorkToBePerformed, dto.getDateOfWorkToBePerformed());
        if (fields.contains("timeOfWorkToBePerformed")) setIfDifferent(entity::getTimeOfWorkToBePerformed, entity::setTimeOfWorkToBePerformed, dto.getTimeOfWorkToBePerformed());
        if (fields.contains("requestedBy")) setIfDifferent(entity::getRequestedBy, entity::setRequestedBy, dto.getRequestedBy());
        if (fields.contains("company")) setIfDifferent(entity::getCompany, entity::setCompany, dto.getCompany());
        if (fields.contains("location")) setIfDifferent(entity::getLocation, entity::setLocation, dto.getLocation());
        if (fields.contains("affectedEquipment")) setIfDifferent(entity::getAffectedEquipment, entity::setAffectedEquipment, dto.getAffectedEquipment());
        if (fields.contains("isLotoRequired")) setIfDifferent(entity::getIsLotoRequired, entity::setIsLotoRequired, dto.getIsLotoRequired());
        if (fields.contains("isHotWorkRequired")) setIfDifferent(entity::getIsHotWorkRequired, entity::setIsHotWorkRequired, dto.getIsHotWorkRequired());
        if (fields.contains("isConfinedSpaceEntryRequired")) setIfDifferent(entity::getIsConfinedSpaceEntryRequired, entity::setIsConfinedSpaceEntryRequired, dto.getIsConfinedSpaceEntryRequired());
        if (fields.contains("foreman")) setIfDifferent(entity::getForeman, entity::setForeman, dto.getForeman());
        if (fields.contains("fireWatch")) setIfDifferent(entity::getFireWatch, entity::setFireWatch, dto.getFireWatch());
        if (fields.contains("space")) setIfDifferent(entity::getSpace, entity::setSpace, dto.getSpace());
        if (fields.contains("submitterName")) setIfDifferent(entity::getSubmitterName, entity::setSubmitterName, dto.getSubmitterName());
        if (fields.contains("submitterEmail")) setIfDifferent(entity::getSubmitterEmail, entity::setSubmitterEmail, dto.getSubmitterEmail());
        if (fields.contains("submitterPhone")) setIfDifferent(entity::getSubmitterPhone, entity::setSubmitterPhone, dto.getSubmitterPhone());
        if (fields.contains("submitterCompany")) setIfDifferent(entity::getSubmitterCompany, entity::setSubmitterCompany, dto.getSubmitterCompany());
        if (fields.contains("localUuid")) setIfDifferent(entity::getLocalUuid, entity::setLocalUuid, dto.getLocalUuid());
        if (fields.contains("timeSubmitted")) setIfDifferent(entity::getTimeSubmitted, entity::setTimeSubmitted, dto.getTimeSubmitted());
        if (fields.contains("workCategory")) {
            if (dto.getWorkCategoryName() != null && !dto.getWorkCategoryName().isBlank()) {
                String currentName = entity.getWorkCategory() != null ? entity.getWorkCategory().getName() : null;
                if (!dto.getWorkCategoryName().equals(currentName)) {
                    entity.setWorkCategory(valueService.createValue("Work Category", dto.getWorkCategoryName()));
                }
            } else {
                entity.setWorkCategory(null);
            }
        }
        if (fields.contains("workArea")) {
            if (dto.getWorkAreaName() != null && !dto.getWorkAreaName().isBlank()) {
                String currentName = entity.getWorkArea() != null ? entity.getWorkArea().getName() : null;
                if (!dto.getWorkAreaName().equalsIgnoreCase(currentName)) {
                    workAreaRepo.findFirstByNameIgnoreCase(dto.getWorkAreaName()).ifPresentOrElse(
                        entity::setWorkArea,
                        () -> entity.setWorkArea(null)
                    );
                }
            } else {
                entity.setWorkArea(null);
            }
        }
    }

    /** Only call the setter if the new value differs from the current one. */
    private static <T> void setIfDifferent(java.util.function.Supplier<T> getter,
                                            java.util.function.Consumer<T> setter, T newValue) {
        if (!Objects.equals(getter.get(), newValue)) {
            setter.accept(newValue);
        }
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

    @Transactional
    protected WorkRequestSyncDecision processRemoteItemInTransaction(
        WorkRequestDto remote,
        SyncResult result,
        String spId,
        Map<String, String> spValues,
        Instant spModified
    ) {
        WorkRequest existing = workRequestRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);
        WorkRequest localUuidMatch = findByLocalUuid(remote.getLocalUuid());

        if (existing == null && localUuidMatch != null) {
            existing = localUuidMatch;
            if (!Objects.equals(existing.getSharepointId(), spId)) {
                existing.setSharepointId(spId);
            }
            log.info("[WR Syncable] Bound orphan/local WR id={} localUuid={} to SharePoint ID={}",
                existing.getId(), remote.getLocalUuid(), spId);
            // This row existed before SharePoint binding, so late clients may never
            // have received a CREATE marker. Repair it after this transaction commits.
            return new WorkRequestSyncDecision(EntitySyncOutcome.UPDATED, existing.getId(), true, true);
        } else if (existing != null && localUuidMatch != null
                && !existing.getId().equals(localUuidMatch.getId())) {
            workRequestMergeService.mergeDuplicateIntoCanonical(
                localUuidMatch.getId(), existing.getId(), spId);
            log.info("[WR Syncable] Reconciled duplicate WR localUuid={} duplicateId={} canonicalId={} spId={}",
                remote.getLocalUuid(), localUuidMatch.getId(), existing.getId(), spId);
        }

        if (existing == null) {
            WorkRequest entity = workRequestMapper.fromSharePointDto(remote);
            String remoteStatus = remote.getStatus() != null ? remote.getStatus() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            workRequestRepo.save(entity);
            result.incrementCreated();
            log.debug("[WR Syncable] Created: spId={}", spId);

            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return new WorkRequestSyncDecision(EntitySyncOutcome.CREATED, entity.getId(), true, false);
        }

        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return new WorkRequestSyncDecision(EntitySyncOutcome.SKIPPED, existing.getId(), true, false);
        }

        log.debug("[WR Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.debug("[WR Syncable] spId={}: local wins ALL fields, entity unchanged", spId);
            // Still update snapshot so we don't re-detect the same SP "changes" every 30s.
            // Local FieldChange timestamps are preserved — if SP later updates a field,
            // the new SP value will differ from snapshot and trigger conflict resolution again.
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return new WorkRequestSyncDecision(EntitySyncOutcome.SKIPPED, existing.getId(), true, false);
        }

        log.debug("[WR Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        if (fieldsToApply.contains("status")) {
            String remoteStatus = remote.getStatus() != null ? remote.getStatus() : "Active";
            String currentStatus = existing.getPermitStatus() != null ? existing.getPermitStatus().getName() : null;
            if (!remoteStatus.equalsIgnoreCase(currentStatus)) {
                existing.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            }
        }

        workRequestRepo.save(existing);
        result.incrementUpdated();
        log.debug("[WR Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return new WorkRequestSyncDecision(EntitySyncOutcome.UPDATED, existing.getId(), true, false);
    }

    private WorkRequest findByLocalUuid(String localUuid) {
        if (localUuid == null || localUuid.isBlank()) {
            return null;
        }
        return workRequestRepo.findFirstByLocalUuidOrderByIdAsc(localUuid).orElse(null);
    }

    private record WorkRequestSyncDecision(
        EntitySyncOutcome outcome,
        Long entityId,
        boolean shouldSyncAttachments,
        boolean shouldEnsureCreateHistory
    ) {
    }
}
