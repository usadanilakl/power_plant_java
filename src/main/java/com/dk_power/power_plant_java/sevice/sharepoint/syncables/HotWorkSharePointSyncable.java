package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.repository.permits.HotWorkRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.HotWorkSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.HotWorkMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class HotWorkSharePointSyncable implements SharePointSyncable<HotWorkDto> {

    private final HotWorkSharePointAdapter hotWorkAdapter;
    private final HotWorkRepo hotWorkRepo;
    private final NgValueService valueService;
    private final HotWorkMergeService hotWorkMergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "HotWork";
    private static final String LIST_TITLE = "Hot Work Permits";

    /** Entity field name → SP column name. */
    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("workScope", "Title"),
        Map.entry("date", "Date"),
        Map.entry("foreman", "Foreman"),
        Map.entry("fireWatch", "FireWatch"),
        Map.entry("meterModel", "MeterModel"),
        Map.entry("meterNum", "MeterNum"),
        Map.entry("specialInstructions", "SpecialInstructions"),
        Map.entry("location", "LocationOfWork"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<HotWorkDto> fetchAllFromSharePoint() {
        return hotWorkAdapter.getAll();
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(HotWorkDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        HotWork existing = hotWorkRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            // New — create with all fields
            HotWork entity = new HotWork();
            entity.setWorkScope(remote.getWorkScope());
            entity.setDate(remote.getDate());
            entity.setForeman(remote.getForeman());
            entity.setFireWatch(remote.getFireWatch());
            entity.setMeterModel(remote.getMeterModel());
            entity.setMeterNum(remote.getMeterNum());
            entity.setSpecialInstructions(remote.getSpecialInstructions());
            entity.setLocation(remote.getLocation());
            entity.setSharepointId(remote.getSharepointId());
            entity.setLocalUuid(remote.getLocalUuid());

            String remoteStatus = remote.getPermitStatus() != null
                    ? remote.getPermitStatus().getName() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            entity.setCreatedBy("SharePoint Sync");
            hotWorkRepo.save(entity);
            result.incrementCreated();
            log.debug("[HW Syncable] Created: spId={}", spId);

            // Save initial snapshot
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Existing — field-level merge
        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        log.info("[HW Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.info("[HW Syncable] spId={}: local wins ALL fields — entity unchanged, will re-check next sync", spId);
            return EntitySyncOutcome.SKIPPED;
        }

        log.info("[HW Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        hotWorkRepo.save(existing);
        result.incrementUpdated();
        log.info("[HW Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(HotWorkDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // HotWork does not auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        hotWorkMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(HotWorkDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getWorkScope());
        values.put("Date", dto.getDate());
        values.put("Foreman", dto.getForeman());
        values.put("FireWatch", dto.getFireWatch());
        values.put("MeterModel", dto.getMeterModel());
        values.put("MeterNum", dto.getMeterNum());
        values.put("SpecialInstructions", dto.getSpecialInstructions());
        values.put("LocationOfWork", dto.getLocation());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(HotWorkDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, HotWorkDto dto, Set<String> fields) {
        HotWork entity = (HotWork) entityObj;
        if (fields.contains("workScope")) entity.setWorkScope(dto.getWorkScope());
        if (fields.contains("date")) entity.setDate(dto.getDate());
        if (fields.contains("foreman")) entity.setForeman(dto.getForeman());
        if (fields.contains("fireWatch")) entity.setFireWatch(dto.getFireWatch());
        if (fields.contains("meterModel")) entity.setMeterModel(dto.getMeterModel());
        if (fields.contains("meterNum")) entity.setMeterNum(dto.getMeterNum());
        if (fields.contains("specialInstructions")) entity.setSpecialInstructions(dto.getSpecialInstructions());
        if (fields.contains("location")) entity.setLocation(dto.getLocation());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return hotWorkRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(HotWork::getId)
            .orElse(null);
    }
}
