package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.mappers.field_list.FieldListItemMapper;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.FieldListItemSharePointAdapter;
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
public class FieldListItemSharePointSyncable implements SharePointSyncable<FieldListItemDto> {

    private final FieldListItemSharePointAdapter adapter;
    private final FieldListItemRepo repo;
    private final FieldListItemMapper mapper;
    private final NgValueService valueService;
    private final SharePointFieldMergeService fieldMergeService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;

    private static final String ENTITY_TYPE = "FieldListItem";
    private static final String LIST_TITLE = "Field Lists";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("title", "Title"),
        Map.entry("listType", "ListType"),
        Map.entry("status", "Status"),
        Map.entry("location", "Location"),
        Map.entry("specificLocation", "SpecificLocation"),
        Map.entry("notes", "Notes"),
        Map.entry("dateObserved", "DateObserved"),
        Map.entry("equipment", "EquipmentTag"),
        Map.entry("submitterName", "SubmitterName"),
        Map.entry("submitterEmail", "SubmitterEmail"),
        Map.entry("submitterPhone", "SubmitterPhone"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<FieldListItemDto> fetchAllFromSharePoint() {
        return adapter.getAll();
    }

    @Override
    public List<FieldListItemDto> fetchModifiedSince(Instant since) {
        return adapter.getModifiedSince(since);
    }

    @Override
    public long getSyncIntervalMs() { return 60_000; } // 1 minute

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(FieldListItemDto remote, SyncResult result) {
        if (remote.getSharepointId() == null || remote.getSharepointId().isEmpty()) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        // Find existing: by sharepointId first, then by localUuid
        FieldListItem existing = repo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);
        if (existing == null && remote.getLocalUuid() != null && !remote.getLocalUuid().isEmpty()) {
            existing = repo.findFirstByLocalUuidOrderByIdAsc(remote.getLocalUuid()).orElse(null);
            if (existing != null) {
                existing.setSharepointId(spId);
                repo.save(existing);
                log.info("[FieldList-Sync] Bound localUuid={} to spId={}", remote.getLocalUuid(), spId);
            }
        }

        if (existing == null) {
            FieldListItem entity = mapper.convertToEntity(remote);
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

    @Override
    public String getSharepointId(FieldListItemDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // no-op — field list items don't auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        // no-op — handled by localUuid binding in processRemoteItem
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(FieldListItemDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getTitle());
        values.put("ListType", dto.getListTypeName());
        values.put("Status", dto.getStatusName());
        values.put("Location", dto.getLocationName());
        values.put("SpecificLocation", dto.getSpecificLocation());
        values.put("Notes", dto.getNotes());
        values.put("DateObserved", dto.getDateObserved());
        values.put("EquipmentTag", dto.getEquipmentTag());
        values.put("SubmitterName", dto.getSubmitterName());
        values.put("SubmitterEmail", dto.getSubmitterEmail());
        values.put("SubmitterPhone", dto.getSubmitterPhone());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(FieldListItemDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, FieldListItemDto dto, Set<String> fields) {
        FieldListItem entity = (FieldListItem) entityObj;
        if (fields.contains("title")) entity.setTitle(dto.getTitle());
        if (fields.contains("listType") && dto.getListTypeName() != null) {
            entity.setListType(valueService.createValue("FieldListType", dto.getListTypeName()));
        }
        if (fields.contains("status") && dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("FieldListStatus", dto.getStatusName()));
        }
        if (fields.contains("location") && dto.getLocationName() != null) {
            entity.setLocation(valueService.createValue("Location", dto.getLocationName()));
        }
        if (fields.contains("specificLocation")) entity.setSpecificLocation(dto.getSpecificLocation());
        if (fields.contains("notes")) entity.setNotes(dto.getNotes());
        if (fields.contains("dateObserved")) {
            entity.setDateObserved(dto.getDateObserved());
            entity.setTimeObserved(dto.getTimeObserved());
        }
        if (fields.contains("equipment")) {
            mapper.resolveEquipmentReference(entity, dto.getEquipmentTag(), null);
        }
        if (fields.contains("submitterName")) entity.setSubmitterName(dto.getSubmitterName());
        if (fields.contains("submitterEmail")) entity.setSubmitterEmail(dto.getSubmitterEmail());
        if (fields.contains("submitterPhone")) entity.setSubmitterPhone(dto.getSubmitterPhone());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        entity.setSharepointId(dto.getSharepointId());
    }

    private void syncAttachmentsSafely(Long entityId, String sharepointId) {
        try {
            permitAttachmentSyncService.syncAttachmentsForFieldListItem(entityId, sharepointId);
        } catch (Exception e) {
            log.warn("[FieldList Syncable] Attachment sync failed for spId={}: {}", sharepointId, e.getMessage());
        }
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return repo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(FieldListItem::getId)
            .orElse(null);
    }
}
