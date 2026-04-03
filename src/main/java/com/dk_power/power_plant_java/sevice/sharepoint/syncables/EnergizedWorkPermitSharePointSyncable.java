package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.EnergizedWorkPermitDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.EnergizedWorkPermit;
import com.dk_power.power_plant_java.repository.permits.EnergizedWorkPermitRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.EnergizedWorkPermitSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.EnergizedWorkPermitMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class EnergizedWorkPermitSharePointSyncable implements SharePointSyncable<EnergizedWorkPermitDto> {

    private final EnergizedWorkPermitSharePointAdapter ewpAdapter;
    private final EnergizedWorkPermitRepo ewpRepo;
    private final NgValueService valueService;
    private final EnergizedWorkPermitMergeService ewpMergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "EnergizedWorkPermit";
    private static final String LIST_TITLE = "Energized Work Permits";

    /** Entity field name -> SP column name. */
    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("workScope", "Title"),
        Map.entry("date", "Date"),
        Map.entry("time", "Time"),
        Map.entry("location", "LocationOfWork"),
        Map.entry("issuedTo", "IssuedTo"),
        Map.entry("workOrder", "WorkOrder"),
        Map.entry("circuitDescription", "CircuitDescription"),
        Map.entry("workDescription", "WorkDescription"),
        Map.entry("justification", "Justification"),
        Map.entry("requester", "Requester"),
        Map.entry("requesterDate", "RequesterDate"),
        Map.entry("qualifiedPersonSignature", "QualifiedPersonSignature"),
        Map.entry("qualifiedPersonDate", "QualifiedPersonDate"),
        Map.entry("plantManagerSignature", "PlantManagerSignature"),
        Map.entry("plantManagerDate", "PlantManagerDate"),
        Map.entry("workCanBePerformedSafely", "WorkCanBePerformedSafely"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<EnergizedWorkPermitDto> fetchAllFromSharePoint() {
        return ewpAdapter.getAll();
    }

    @Override
    public List<EnergizedWorkPermitDto> fetchModifiedSince(Instant since) {
        return ewpAdapter.getModifiedSince(since);
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(EnergizedWorkPermitDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        EnergizedWorkPermit existing = ewpRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            // New — create with all fields
            EnergizedWorkPermit entity = new EnergizedWorkPermit();
            entity.setWorkScope(remote.getWorkScope());
            entity.setDate(remote.getDate());
            entity.setTime(remote.getTime());
            entity.setLocation(remote.getLocation());
            entity.setIssuedTo(remote.getIssuedTo());
            entity.setWorkOrder(remote.getWorkOrder());
            entity.setCircuitDescription(remote.getCircuitDescription());
            entity.setWorkDescription(remote.getWorkDescription());
            entity.setJustification(remote.getJustification());
            entity.setRequester(remote.getRequester());
            entity.setRequesterDate(remote.getRequesterDate());
            entity.setQualifiedPersonSignature(remote.getQualifiedPersonSignature());
            entity.setQualifiedPersonDate(remote.getQualifiedPersonDate());
            entity.setPlantManagerSignature(remote.getPlantManagerSignature());
            entity.setPlantManagerDate(remote.getPlantManagerDate());
            entity.setWorkCanBePerformedSafely(remote.getWorkCanBePerformedSafely());
            entity.setSharepointId(spId);
            entity.setLocalUuid(remote.getLocalUuid());

            String remoteStatus = remote.getPermitStatus() != null && remote.getPermitStatus().getName() != null
                ? remote.getPermitStatus().getName() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            entity.setCreatedBy("SharePoint Sync");
            ewpRepo.save(entity);
            result.incrementCreated();
            log.debug("[EWP Syncable] Created: spId={}", spId);

            // Save initial snapshot
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Existing — field-level merge
        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[EWP Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.debug("[EWP Syncable] spId={}: local wins ALL fields — entity unchanged, snapshot updated", spId);
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[EWP Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        ewpRepo.save(existing);
        result.incrementUpdated();
        log.debug("[EWP Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(EnergizedWorkPermitDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // EnergizedWorkPermit does not auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        ewpMergeService.mergeIfDuplicatesExist();
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
    public Map<String, String> extractSpFieldValues(EnergizedWorkPermitDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getWorkScope());
        values.put("Date", dto.getDate());
        values.put("Time", dto.getTime());
        values.put("LocationOfWork", dto.getLocation());
        values.put("IssuedTo", dto.getIssuedTo());
        values.put("WorkOrder", dto.getWorkOrder());
        values.put("CircuitDescription", dto.getCircuitDescription());
        values.put("WorkDescription", dto.getWorkDescription());
        values.put("Justification", dto.getJustification());
        values.put("Requester", dto.getRequester());
        values.put("RequesterDate", dto.getRequesterDate());
        values.put("QualifiedPersonSignature", dto.getQualifiedPersonSignature());
        values.put("QualifiedPersonDate", dto.getQualifiedPersonDate());
        values.put("PlantManagerSignature", dto.getPlantManagerSignature());
        values.put("PlantManagerDate", dto.getPlantManagerDate());
        values.put("WorkCanBePerformedSafely", dto.getWorkCanBePerformedSafely() != null ? dto.getWorkCanBePerformedSafely().toString() : null);
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(EnergizedWorkPermitDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, EnergizedWorkPermitDto dto, Set<String> fields) {
        EnergizedWorkPermit entity = (EnergizedWorkPermit) entityObj;
        if (fields.contains("workScope")) entity.setWorkScope(dto.getWorkScope());
        if (fields.contains("date")) entity.setDate(dto.getDate());
        if (fields.contains("time")) entity.setTime(dto.getTime());
        if (fields.contains("location")) entity.setLocation(dto.getLocation());
        if (fields.contains("issuedTo")) entity.setIssuedTo(dto.getIssuedTo());
        if (fields.contains("workOrder")) entity.setWorkOrder(dto.getWorkOrder());
        if (fields.contains("circuitDescription")) entity.setCircuitDescription(dto.getCircuitDescription());
        if (fields.contains("workDescription")) entity.setWorkDescription(dto.getWorkDescription());
        if (fields.contains("justification")) entity.setJustification(dto.getJustification());
        if (fields.contains("requester")) entity.setRequester(dto.getRequester());
        if (fields.contains("requesterDate")) entity.setRequesterDate(dto.getRequesterDate());
        if (fields.contains("qualifiedPersonSignature")) entity.setQualifiedPersonSignature(dto.getQualifiedPersonSignature());
        if (fields.contains("qualifiedPersonDate")) entity.setQualifiedPersonDate(dto.getQualifiedPersonDate());
        if (fields.contains("plantManagerSignature")) entity.setPlantManagerSignature(dto.getPlantManagerSignature());
        if (fields.contains("plantManagerDate")) entity.setPlantManagerDate(dto.getPlantManagerDate());
        if (fields.contains("workCanBePerformedSafely")) entity.setWorkCanBePerformedSafely(dto.getWorkCanBePerformedSafely());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return ewpRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(EnergizedWorkPermit::getId)
            .orElse(null);
    }
}
