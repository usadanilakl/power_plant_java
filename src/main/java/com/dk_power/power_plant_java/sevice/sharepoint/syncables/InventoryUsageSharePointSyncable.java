package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.inventory.InventoryUsageDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.inventory.InventoryItem;
import com.dk_power.power_plant_java.entities.inventory.InventoryUsage;
import com.dk_power.power_plant_java.repository.inventory.InventoryItemRepo;
import com.dk_power.power_plant_java.repository.inventory.InventoryUsageRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InventoryUsageSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryUsageSharePointSyncable implements SharePointSyncable<InventoryUsageDto> {

    private final InventoryUsageSharePointAdapter adapter;
    private final InventoryUsageRepo repo;
    private final InventoryItemRepo itemRepo;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "InventoryUsage";
    private static final String LIST_TITLE = "Inventory Usage";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("userName", "UserName"),
        Map.entry("userEmail", "UserEmail"),
        Map.entry("location", "Location"),
        Map.entry("purpose", "Purpose"),
        Map.entry("comments", "Comments"),
        Map.entry("eventType", "EventType"),
        Map.entry("scannedAt", "ScannedAt"),
        Map.entry("returnedAt", "ReturnedAt"),
        Map.entry("localUuid", "PwaId")
    );

    @Override public String getEntityTypeName() { return ENTITY_TYPE; }
    @Override public String getSharePointListTitle() { return LIST_TITLE; }
    @Override public List<InventoryUsageDto> fetchAllFromSharePoint() { return adapter.getAll(); }
    @Override public List<InventoryUsageDto> fetchModifiedSince(Instant since) { return adapter.getModifiedSince(since); }
    @Override public long getSyncIntervalMs() { return 60_000; }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(InventoryUsageDto remote, SyncResult result) {
        if (remote.getSharepointId() == null || remote.getSharepointId().isEmpty()) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        InventoryUsage existing = repo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);
        if (existing == null && remote.getLocalUuid() != null && !remote.getLocalUuid().isEmpty()) {
            existing = repo.findFirstByLocalUuidOrderByIdAsc(remote.getLocalUuid()).orElse(null);
            if (existing != null) {
                existing.setSharepointId(spId);
                repo.save(existing);
            }
        }

        if (existing == null) {
            // Create new local usage record
            InventoryUsage entity = new InventoryUsage();
            entity.setSharepointId(spId);
            entity.setLocalUuid(remote.getLocalUuid());
            entity.setUserName(remote.getUserName());
            entity.setUserEmail(remote.getUserEmail());
            entity.setLocation(remote.getLocation());
            entity.setPurpose(remote.getPurpose());
            entity.setComments(remote.getComments());
            entity.setEventType(remote.getEventType());
            entity.setScannedAt(remote.getScannedAt());
            entity.setReturnedAt(remote.getReturnedAt());
            entity.setSpModifiedTime(spModified);

            // Resolve inventory item by ID or QR token
            if (remote.getInventoryItemId() != null) {
                itemRepo.findById(remote.getInventoryItemId()).ifPresent(entity::setInventoryItem);
            }
            if (entity.getInventoryItem() == null && remote.getInventoryItemQrToken() != null) {
                itemRepo.findFirstByQrTokenOrderByIdAsc(remote.getInventoryItemQrToken())
                        .ifPresent(entity::setInventoryItem);
            }

            repo.save(entity);
            result.incrementCreated();
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Update existing
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
        return EntitySyncOutcome.UPDATED;
    }

    @Override public String getSharepointId(InventoryUsageDto dto) { return dto.getSharepointId(); }
    @Override public boolean supportsAutoClose() { return false; }
    @Override public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {}
    @Override public void mergeIfDuplicatesExist() {}
    @Override public Map<String, String> getFieldMapping() { return FIELD_MAPPING; }

    @Override
    public Map<String, String> extractSpFieldValues(InventoryUsageDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("UserName", dto.getUserName());
        values.put("UserEmail", dto.getUserEmail());
        values.put("Location", dto.getLocation());
        values.put("Purpose", dto.getPurpose());
        values.put("Comments", dto.getComments());
        values.put("EventType", dto.getEventType());
        values.put("ScannedAt", dto.getScannedAt() != null ? dto.getScannedAt().toString() : null);
        values.put("ReturnedAt", dto.getReturnedAt() != null ? dto.getReturnedAt().toString() : null);
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override public Instant getSpModifiedTime(InventoryUsageDto dto) { return dto.getSpModifiedTime(); }

    @Override
    public void applySelectiveFields(Object entityObj, InventoryUsageDto dto, Set<String> fields) {
        InventoryUsage entity = (InventoryUsage) entityObj;
        if (fields.contains("userName")) entity.setUserName(dto.getUserName());
        if (fields.contains("userEmail")) entity.setUserEmail(dto.getUserEmail());
        if (fields.contains("location")) entity.setLocation(dto.getLocation());
        if (fields.contains("purpose")) entity.setPurpose(dto.getPurpose());
        if (fields.contains("comments")) entity.setComments(dto.getComments());
        if (fields.contains("eventType")) entity.setEventType(dto.getEventType());
        if (fields.contains("scannedAt")) entity.setScannedAt(dto.getScannedAt());
        if (fields.contains("returnedAt")) entity.setReturnedAt(dto.getReturnedAt());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        entity.setSharepointId(dto.getSharepointId());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return repo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(InventoryUsage::getId)
            .orElse(null);
    }
}
