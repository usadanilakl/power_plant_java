package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.repository.permits.ConfinedSpaceRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.ConfinedSpaceSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.ConfinedSpaceMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class ConfinedSpaceSharePointSyncable implements SharePointSyncable<ConfinedSpaceDto> {

    private final ConfinedSpaceSharePointAdapter confinedSpaceAdapter;
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final NgValueService valueService;
    private final ConfinedSpaceMergeService confinedSpaceMergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "ConfinedSpace";
    private static final String LIST_TITLE = "Confined Space Permits";

    /** Entity field name → SP column name. */
    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("workScope", "Title"),
        Map.entry("date", "Date"),
        Map.entry("time", "Time"),
        Map.entry("space", "SpaceToBeEntered"),
        Map.entry("issuedTo", "IssuedTo"),
        Map.entry("duration", "Duration"),
        Map.entry("meterModel", "MeterModel"),
        Map.entry("meterNum", "MeterNum"),
        Map.entry("calibrated", "Calibrated"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<ConfinedSpaceDto> fetchAllFromSharePoint() {
        return confinedSpaceAdapter.getAll();
    }

    @Override
    public List<ConfinedSpaceDto> fetchModifiedSince(Instant since) {
        return confinedSpaceAdapter.getModifiedSince(since);
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(ConfinedSpaceDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        ConfinedSpace existing = confinedSpaceRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            // New — create with all fields
            ConfinedSpace entity = new ConfinedSpace();
            entity.setWorkScope(remote.getWorkScope());
            entity.setDate(remote.getDate());
            entity.setTime(remote.getTime());
            entity.setSpace(remote.getSpace());
            entity.setIssuedTo(remote.getIssuedTo());
            entity.setDuration(remote.getDuration());
            entity.setMeterModel(remote.getMeterModel());
            entity.setMeterNum(remote.getMeterNum());
            entity.setCalibrated(remote.isCalibrated());
            entity.setSharepointId(remote.getSharepointId());
            entity.setLocalUuid(remote.getLocalUuid());

            String remoteStatus = remote.getPermitStatus() != null
                    ? remote.getPermitStatus().getName() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            entity.setCreatedBy("SharePoint Sync");
            confinedSpaceRepo.save(entity);
            result.incrementCreated();
            log.debug("[CS Syncable] Created: spId={}", spId);

            // Save initial snapshot
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Existing — field-level merge
        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[CS Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.debug("[CS Syncable] spId={}: local wins ALL fields — entity unchanged, snapshot updated", spId);
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[CS Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        confinedSpaceRepo.save(existing);
        result.incrementUpdated();
        log.debug("[CS Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(ConfinedSpaceDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // ConfinedSpace does not auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        confinedSpaceMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(ConfinedSpaceDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getWorkScope());
        values.put("Date", dto.getDate());
        values.put("Time", dto.getTime());
        values.put("SpaceToBeEntered", dto.getSpace());
        values.put("IssuedTo", dto.getIssuedTo());
        values.put("Duration", dto.getDuration());
        values.put("MeterModel", dto.getMeterModel());
        values.put("MeterNum", dto.getMeterNum());
        values.put("Calibrated", String.valueOf(dto.isCalibrated()));
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(ConfinedSpaceDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, ConfinedSpaceDto dto, Set<String> fields) {
        ConfinedSpace entity = (ConfinedSpace) entityObj;
        if (fields.contains("workScope")) entity.setWorkScope(dto.getWorkScope());
        if (fields.contains("date")) entity.setDate(dto.getDate());
        if (fields.contains("time")) entity.setTime(dto.getTime());
        if (fields.contains("space")) entity.setSpace(dto.getSpace());
        if (fields.contains("issuedTo")) entity.setIssuedTo(dto.getIssuedTo());
        if (fields.contains("duration")) entity.setDuration(dto.getDuration());
        if (fields.contains("meterModel")) entity.setMeterModel(dto.getMeterModel());
        if (fields.contains("meterNum")) entity.setMeterNum(dto.getMeterNum());
        if (fields.contains("calibrated")) entity.setCalibrated(dto.isCalibrated());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return confinedSpaceRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(ConfinedSpace::getId)
            .orElse(null);
    }
}
