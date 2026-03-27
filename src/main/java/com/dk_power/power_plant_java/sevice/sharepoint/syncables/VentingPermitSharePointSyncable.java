package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.VentingPermitDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.VentingPermit;
import com.dk_power.power_plant_java.repository.permits.VentingPermitRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.VentingPermitSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.VentingPermitMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class VentingPermitSharePointSyncable implements SharePointSyncable<VentingPermitDto> {

    private final VentingPermitSharePointAdapter ventAdapter;
    private final VentingPermitRepo ventRepo;
    private final NgValueService valueService;
    private final VentingPermitMergeService ventMergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "VentingPermit";
    private static final String LIST_TITLE = "Venting Permits";

    /** Entity field name -> SP column name. */
    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("workScope", "Title"),
        Map.entry("date", "Date"),
        Map.entry("time", "Time"),
        Map.entry("location", "LocationOfWork"),
        Map.entry("issuedTo", "IssuedTo"),
        Map.entry("plantName", "PlantName"),
        Map.entry("systemName", "SystemName"),
        Map.entry("requestingIndividual", "RequestingIndividual"),
        Map.entry("purpose", "Purpose"),
        Map.entry("timeCommence", "TimeCommence"),
        Map.entry("timeConclude", "TimeConclude"),
        Map.entry("gasType", "GasType"),
        Map.entry("lel", "LEL"),
        Map.entry("uel", "UEL"),
        Map.entry("calculatedVolume", "CalculatedVolume"),
        Map.entry("pressure", "Pressure"),
        Map.entry("gasIndicatorModel", "GasIndicatorModel"),
        Map.entry("gasIndicatorSerial", "GasIndicatorSerial"),
        Map.entry("calibrationDate", "CalibrationDate"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<VentingPermitDto> fetchAllFromSharePoint() {
        return ventAdapter.getAll();
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(VentingPermitDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        VentingPermit existing = ventRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            // New — create with all fields
            VentingPermit entity = new VentingPermit();
            entity.setWorkScope(remote.getWorkScope());
            entity.setDate(remote.getDate());
            entity.setTime(remote.getTime());
            entity.setLocation(remote.getLocation());
            entity.setIssuedTo(remote.getIssuedTo());
            entity.setPlantName(remote.getPlantName());
            entity.setSystemName(remote.getSystemName());
            entity.setRequestingIndividual(remote.getRequestingIndividual());
            entity.setPurpose(remote.getPurpose());
            entity.setTimeCommence(remote.getTimeCommence());
            entity.setTimeConclude(remote.getTimeConclude());
            entity.setGasType(remote.getGasType());
            entity.setLel(remote.getLel());
            entity.setUel(remote.getUel());
            entity.setCalculatedVolume(remote.getCalculatedVolume());
            entity.setPressure(remote.getPressure());
            entity.setGasIndicatorModel(remote.getGasIndicatorModel());
            entity.setGasIndicatorSerial(remote.getGasIndicatorSerial());
            entity.setCalibrationDate(remote.getCalibrationDate());
            entity.setSharepointId(spId);
            entity.setLocalUuid(remote.getLocalUuid());

            String remoteStatus = remote.getPermitStatus() != null && remote.getPermitStatus().getName() != null
                ? remote.getPermitStatus().getName() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            entity.setCreatedBy("SharePoint Sync");
            ventRepo.save(entity);
            result.incrementCreated();
            log.debug("[VENT Syncable] Created: spId={}", spId);

            // Save initial snapshot
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Existing — field-level merge
        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[VENT Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.debug("[VENT Syncable] spId={}: local wins ALL fields — entity unchanged, will re-check next sync", spId);
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[VENT Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        ventRepo.save(existing);
        result.incrementUpdated();
        log.debug("[VENT Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(VentingPermitDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // VentingPermit does not auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        ventMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public void afterSync(SyncResult result) {
        // No post-sync linking needed
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(VentingPermitDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getWorkScope());
        values.put("Date", dto.getDate());
        values.put("Time", dto.getTime());
        values.put("LocationOfWork", dto.getLocation());
        values.put("IssuedTo", dto.getIssuedTo());
        values.put("PlantName", dto.getPlantName());
        values.put("SystemName", dto.getSystemName());
        values.put("RequestingIndividual", dto.getRequestingIndividual());
        values.put("Purpose", dto.getPurpose());
        values.put("TimeCommence", dto.getTimeCommence());
        values.put("TimeConclude", dto.getTimeConclude());
        values.put("GasType", dto.getGasType());
        values.put("LEL", dto.getLel());
        values.put("UEL", dto.getUel());
        values.put("CalculatedVolume", dto.getCalculatedVolume());
        values.put("Pressure", dto.getPressure());
        values.put("GasIndicatorModel", dto.getGasIndicatorModel());
        values.put("GasIndicatorSerial", dto.getGasIndicatorSerial());
        values.put("CalibrationDate", dto.getCalibrationDate());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(VentingPermitDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, VentingPermitDto dto, Set<String> fields) {
        VentingPermit entity = (VentingPermit) entityObj;
        if (fields.contains("workScope")) entity.setWorkScope(dto.getWorkScope());
        if (fields.contains("date")) entity.setDate(dto.getDate());
        if (fields.contains("time")) entity.setTime(dto.getTime());
        if (fields.contains("location")) entity.setLocation(dto.getLocation());
        if (fields.contains("issuedTo")) entity.setIssuedTo(dto.getIssuedTo());
        if (fields.contains("plantName")) entity.setPlantName(dto.getPlantName());
        if (fields.contains("systemName")) entity.setSystemName(dto.getSystemName());
        if (fields.contains("requestingIndividual")) entity.setRequestingIndividual(dto.getRequestingIndividual());
        if (fields.contains("purpose")) entity.setPurpose(dto.getPurpose());
        if (fields.contains("timeCommence")) entity.setTimeCommence(dto.getTimeCommence());
        if (fields.contains("timeConclude")) entity.setTimeConclude(dto.getTimeConclude());
        if (fields.contains("gasType")) entity.setGasType(dto.getGasType());
        if (fields.contains("lel")) entity.setLel(dto.getLel());
        if (fields.contains("uel")) entity.setUel(dto.getUel());
        if (fields.contains("calculatedVolume")) entity.setCalculatedVolume(dto.getCalculatedVolume());
        if (fields.contains("pressure")) entity.setPressure(dto.getPressure());
        if (fields.contains("gasIndicatorModel")) entity.setGasIndicatorModel(dto.getGasIndicatorModel());
        if (fields.contains("gasIndicatorSerial")) entity.setGasIndicatorSerial(dto.getGasIndicatorSerial());
        if (fields.contains("calibrationDate")) entity.setCalibrationDate(dto.getCalibrationDate());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return ventRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(VentingPermit::getId)
            .orElse(null);
    }
}
