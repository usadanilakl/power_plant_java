package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.inventory.InventoryItemDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.inventory.InventoryItem;
import com.dk_power.power_plant_java.mappers.inventory.InventoryItemMapper;
import com.dk_power.power_plant_java.repository.inventory.InventoryItemRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InventoryItemSharePointAdapter;
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
public class InventoryItemSharePointSyncable implements SharePointSyncable<InventoryItemDto> {

    private final InventoryItemSharePointAdapter adapter;
    private final InventoryItemRepo repo;
    private final InventoryItemMapper mapper;
    private final NgValueService valueService;
    private final SharePointFieldMergeService fieldMergeService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;

    private static final String ENTITY_TYPE = "InventoryItem";
    private static final String LIST_TITLE = "Inventory";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("title", "Title"),
        Map.entry("itemType", "ItemType"),
        Map.entry("status", "Status"),
        Map.entry("location", "Location"),
        Map.entry("description", "Description"),
        Map.entry("serialNumber", "SerialNumber"),
        Map.entry("manufacturer", "Manufacturer"),
        Map.entry("model", "Model"),
        Map.entry("qrToken", "QrToken"),
        Map.entry("currentLocation", "CurrentLocation"),
        Map.entry("currentHolderName", "CurrentHolderName"),
        Map.entry("currentHolderEmail", "CurrentHolderEmail"),
        Map.entry("submitterName", "SubmitterName"),
        Map.entry("submitterEmail", "SubmitterEmail"),
        Map.entry("submitterPhone", "SubmitterPhone"),
        Map.entry("localUuid", "PwaId")
    );

    @Override public String getEntityTypeName() { return ENTITY_TYPE; }
    @Override public String getSharePointListTitle() { return LIST_TITLE; }
    @Override public List<InventoryItemDto> fetchAllFromSharePoint() { return adapter.getAll(); }
    @Override public List<InventoryItemDto> fetchModifiedSince(Instant since) { return adapter.getModifiedSince(since); }
    @Override public long getSyncIntervalMs() { return 60_000; }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(InventoryItemDto remote, SyncResult result) {
        if (remote.getSharepointId() == null || remote.getSharepointId().isEmpty()) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        InventoryItem existing = repo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);
        if (existing == null && remote.getLocalUuid() != null && !remote.getLocalUuid().isEmpty()) {
            existing = repo.findFirstByLocalUuidOrderByIdAsc(remote.getLocalUuid()).orElse(null);
            if (existing != null) {
                existing.setSharepointId(spId);
                repo.save(existing);
                log.info("[Inventory-Sync] Bound localUuid={} to spId={}", remote.getLocalUuid(), spId);
            }
        }

        if (existing == null) {
            InventoryItem entity = mapper.convertToEntity(remote);
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

    @Override public String getSharepointId(InventoryItemDto dto) { return dto.getSharepointId(); }
    @Override public boolean supportsAutoClose() { return false; }
    @Override public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {}
    @Override public void mergeIfDuplicatesExist() {}
    @Override public Map<String, String> getFieldMapping() { return FIELD_MAPPING; }

    @Override
    public Map<String, String> extractSpFieldValues(InventoryItemDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getTitle());
        values.put("ItemType", dto.getItemTypeName());
        values.put("Status", dto.getStatusName());
        values.put("Location", dto.getLocationName());
        values.put("Description", dto.getDescription());
        values.put("SerialNumber", dto.getSerialNumber());
        values.put("Manufacturer", dto.getManufacturer());
        values.put("Model", dto.getModel());
        values.put("QrToken", dto.getQrToken());
        values.put("CurrentLocation", dto.getCurrentLocation());
        values.put("CurrentHolderName", dto.getCurrentHolderName());
        values.put("CurrentHolderEmail", dto.getCurrentHolderEmail());
        values.put("SubmitterName", dto.getSubmitterName());
        values.put("SubmitterEmail", dto.getSubmitterEmail());
        values.put("SubmitterPhone", dto.getSubmitterPhone());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override public Instant getSpModifiedTime(InventoryItemDto dto) { return dto.getSpModifiedTime(); }

    @Override
    public void applySelectiveFields(Object entityObj, InventoryItemDto dto, Set<String> fields) {
        InventoryItem entity = (InventoryItem) entityObj;
        if (fields.contains("title")) entity.setTitle(dto.getTitle());
        if (fields.contains("itemType") && dto.getItemTypeName() != null) {
            entity.setItemType(valueService.createValue("InventoryType", dto.getItemTypeName()));
        }
        if (fields.contains("status") && dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("InventoryStatus", dto.getStatusName()));
        }
        // Free-text home location from SharePoint: store as text, link a Location Value only on an
        // exact existing match. This path polls SP every 30s, so the old createValue here minted a
        // Value for every spelling variant on a loop.
        if (fields.contains("location") && dto.getLocationName() != null) {
            mapper.resolveLocation(entity, dto.getLocationName());
        }
        if (fields.contains("description")) entity.setDescription(dto.getDescription());
        if (fields.contains("serialNumber")) entity.setSerialNumber(dto.getSerialNumber());
        if (fields.contains("manufacturer")) entity.setManufacturer(dto.getManufacturer());
        if (fields.contains("model")) entity.setModel(dto.getModel());
        if (fields.contains("qrToken")) entity.setQrToken(dto.getQrToken());
        if (fields.contains("currentLocation")) entity.setCurrentLocation(dto.getCurrentLocation());
        if (fields.contains("currentHolderName")) entity.setCurrentHolderName(dto.getCurrentHolderName());
        if (fields.contains("currentHolderEmail")) entity.setCurrentHolderEmail(dto.getCurrentHolderEmail());
        if (fields.contains("submitterName")) entity.setSubmitterName(dto.getSubmitterName());
        if (fields.contains("submitterEmail")) entity.setSubmitterEmail(dto.getSubmitterEmail());
        if (fields.contains("submitterPhone")) entity.setSubmitterPhone(dto.getSubmitterPhone());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        entity.setSharepointId(dto.getSharepointId());
    }

    private void syncAttachmentsSafely(Long entityId, String sharepointId) {
        try {
            permitAttachmentSyncService.syncAttachmentsForInventoryItem(entityId, sharepointId);
        } catch (Exception e) {
            log.warn("[Inventory Syncable] Attachment sync failed for spId={}: {}", sharepointId, e.getMessage());
        }
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return repo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(InventoryItem::getId)
            .orElse(null);
    }
}
