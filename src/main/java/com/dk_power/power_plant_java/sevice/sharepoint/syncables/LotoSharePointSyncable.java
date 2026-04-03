package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.LotoSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.LotoMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class LotoSharePointSyncable implements SharePointSyncable<LotoDto> {

    private final LotoSharePointAdapter lotoAdapter;
    private final LotoRepo lotoRepo;
    private final NgValueService valueService;
    private final LotoMergeService lotoMergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "Loto";
    private static final String LIST_TITLE = "LOTO Permits";

    /** Entity field name -> SP column name. */
    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("workScope", "Title"),
        Map.entry("equipmentSystem", "EquipmentSystem"),
        Map.entry("lotoRequestor", "LotoRequestor"),
        Map.entry("date", "Date"),
        Map.entry("boxNumber", "BoxNumber"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<LotoDto> fetchAllFromSharePoint() {
        return lotoAdapter.getAll();
    }

    @Override
    public List<LotoDto> fetchModifiedSince(Instant since) {
        return lotoAdapter.getModifiedSince(since);
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(LotoDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        Loto existing = lotoRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            // New — create with all fields
            Loto entity = new Loto();
            entity.setWorkScope(remote.getWorkScope());
            entity.setEquipmentSystem(remote.getEquipmentSystem());
            entity.setLotoRequestor(remote.getLotoRequestor());
            entity.setDate(remote.getDate());
            entity.setBoxNumber(remote.getBoxNumber());
            entity.setSharepointId(spId);
            entity.setLocalUuid(remote.getLocalUuid());

            String remoteStatus = remote.getPermitStatus() != null && remote.getPermitStatus().getName() != null
                ? remote.getPermitStatus().getName() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            entity.setCreatedBy("SharePoint Sync");
            lotoRepo.save(entity);
            result.incrementCreated();
            log.debug("[LOTO Syncable] Created: spId={}", spId);

            // Save initial snapshot
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Existing — field-level merge
        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[LOTO Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.debug("[LOTO Syncable] spId={}: local wins ALL fields — entity unchanged, snapshot updated", spId);
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[LOTO Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        lotoRepo.save(existing);
        result.incrementUpdated();
        log.debug("[LOTO Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(LotoDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // LOTO does not auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        lotoMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public void afterSync(SyncResult result) {
        // No post-sync linking needed for LOTO
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(LotoDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getWorkScope());
        values.put("EquipmentSystem", dto.getEquipmentSystem());
        values.put("LotoRequestor", dto.getLotoRequestor());
        values.put("Date", dto.getDate());
        values.put("BoxNumber", dto.getBoxNumber() != null ? dto.getBoxNumber().toString() : null);
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(LotoDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, LotoDto dto, Set<String> fields) {
        Loto entity = (Loto) entityObj;
        if (fields.contains("workScope")) entity.setWorkScope(dto.getWorkScope());
        if (fields.contains("equipmentSystem")) entity.setEquipmentSystem(dto.getEquipmentSystem());
        if (fields.contains("lotoRequestor")) entity.setLotoRequestor(dto.getLotoRequestor());
        if (fields.contains("date")) entity.setDate(dto.getDate());
        if (fields.contains("boxNumber")) entity.setBoxNumber(dto.getBoxNumber());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return lotoRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(Loto::getId)
            .orElse(null);
    }
}
