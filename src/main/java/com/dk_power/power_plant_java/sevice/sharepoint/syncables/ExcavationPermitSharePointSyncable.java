package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.ExcavationPermitDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.ExcavationPermit;
import com.dk_power.power_plant_java.repository.permits.ExcavationPermitRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.ExcavationPermitSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.ExcavationPermitMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExcavationPermitSharePointSyncable implements SharePointSyncable<ExcavationPermitDto> {

    private final ExcavationPermitSharePointAdapter excAdapter;
    private final ExcavationPermitRepo excRepo;
    private final NgValueService valueService;
    private final ExcavationPermitMergeService excMergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "ExcavationPermit";
    private static final String LIST_TITLE = "Excavation Permits";

    /** Entity field name -> SP column name. */
    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("workScope", "Title"),
        Map.entry("date", "Date"),
        Map.entry("time", "Time"),
        Map.entry("location", "LocationOfWork"),
        Map.entry("issuedTo", "IssuedTo"),
        Map.entry("supervisor", "Supervisor"),
        Map.entry("jobLocation", "JobLocation"),
        Map.entry("supervisorPhone", "SupervisorPhone"),
        Map.entry("excavationDescription", "ExcavationDescription"),
        Map.entry("workOrder", "WorkOrder"),
        Map.entry("locationPipingMarked", "LocationPipingMarked"),
        Map.entry("facilityName", "FacilityName"),
        Map.entry("competentPerson", "CompetentPerson"),
        Map.entry("soilType", "SoilType"),
        Map.entry("excavationDepth", "ExcavationDepth"),
        Map.entry("excavationWidth", "ExcavationWidth"),
        Map.entry("protectiveSystemType", "ProtectiveSystemType"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<ExcavationPermitDto> fetchAllFromSharePoint() {
        return excAdapter.getAll();
    }

    @Override
    public List<ExcavationPermitDto> fetchModifiedSince(Instant since) {
        return excAdapter.getModifiedSince(since);
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(ExcavationPermitDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        ExcavationPermit existing = excRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            // New — create with all fields
            ExcavationPermit entity = new ExcavationPermit();
            entity.setWorkScope(remote.getWorkScope());
            entity.setDate(remote.getDate());
            entity.setTime(remote.getTime());
            entity.setLocation(remote.getLocation());
            entity.setIssuedTo(remote.getIssuedTo());
            entity.setSupervisor(remote.getSupervisor());
            entity.setJobLocation(remote.getJobLocation());
            entity.setSupervisorPhone(remote.getSupervisorPhone());
            entity.setExcavationDescription(remote.getExcavationDescription());
            entity.setWorkOrder(remote.getWorkOrder());
            entity.setLocationPipingMarked(remote.getLocationPipingMarked());
            entity.setFacilityName(remote.getFacilityName());
            entity.setCompetentPerson(remote.getCompetentPerson());
            entity.setSoilType(remote.getSoilType());
            entity.setExcavationDepth(remote.getExcavationDepth());
            entity.setExcavationWidth(remote.getExcavationWidth());
            entity.setProtectiveSystemType(remote.getProtectiveSystemType());
            entity.setSharepointId(spId);
            entity.setLocalUuid(remote.getLocalUuid());

            String remoteStatus = remote.getPermitStatus() != null && remote.getPermitStatus().getName() != null
                ? remote.getPermitStatus().getName() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            entity.setCreatedBy("SharePoint Sync");
            excRepo.save(entity);
            result.incrementCreated();
            log.debug("[EXC Syncable] Created: spId={}", spId);

            // Save initial snapshot
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Existing — field-level merge
        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[EXC Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.debug("[EXC Syncable] spId={}: local wins ALL fields — entity unchanged, snapshot updated", spId);
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.SKIPPED;
        }

        log.debug("[EXC Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        excRepo.save(existing);
        result.incrementUpdated();
        log.debug("[EXC Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(ExcavationPermitDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // ExcavationPermit does not auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        excMergeService.mergeIfDuplicatesExist();
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
    public Map<String, String> extractSpFieldValues(ExcavationPermitDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getWorkScope());
        values.put("Date", dto.getDate());
        values.put("Time", dto.getTime());
        values.put("LocationOfWork", dto.getLocation());
        values.put("IssuedTo", dto.getIssuedTo());
        values.put("Supervisor", dto.getSupervisor());
        values.put("JobLocation", dto.getJobLocation());
        values.put("SupervisorPhone", dto.getSupervisorPhone());
        values.put("ExcavationDescription", dto.getExcavationDescription());
        values.put("WorkOrder", dto.getWorkOrder());
        values.put("LocationPipingMarked", dto.getLocationPipingMarked() != null ? dto.getLocationPipingMarked().toString() : null);
        values.put("FacilityName", dto.getFacilityName());
        values.put("CompetentPerson", dto.getCompetentPerson());
        values.put("SoilType", dto.getSoilType());
        values.put("ExcavationDepth", dto.getExcavationDepth());
        values.put("ExcavationWidth", dto.getExcavationWidth());
        values.put("ProtectiveSystemType", dto.getProtectiveSystemType());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(ExcavationPermitDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, ExcavationPermitDto dto, Set<String> fields) {
        ExcavationPermit entity = (ExcavationPermit) entityObj;
        if (fields.contains("workScope")) entity.setWorkScope(dto.getWorkScope());
        if (fields.contains("date")) entity.setDate(dto.getDate());
        if (fields.contains("time")) entity.setTime(dto.getTime());
        if (fields.contains("location")) entity.setLocation(dto.getLocation());
        if (fields.contains("issuedTo")) entity.setIssuedTo(dto.getIssuedTo());
        if (fields.contains("supervisor")) entity.setSupervisor(dto.getSupervisor());
        if (fields.contains("jobLocation")) entity.setJobLocation(dto.getJobLocation());
        if (fields.contains("supervisorPhone")) entity.setSupervisorPhone(dto.getSupervisorPhone());
        if (fields.contains("excavationDescription")) entity.setExcavationDescription(dto.getExcavationDescription());
        if (fields.contains("workOrder")) entity.setWorkOrder(dto.getWorkOrder());
        if (fields.contains("locationPipingMarked")) entity.setLocationPipingMarked(dto.getLocationPipingMarked());
        if (fields.contains("facilityName")) entity.setFacilityName(dto.getFacilityName());
        if (fields.contains("competentPerson")) entity.setCompetentPerson(dto.getCompetentPerson());
        if (fields.contains("soilType")) entity.setSoilType(dto.getSoilType());
        if (fields.contains("excavationDepth")) entity.setExcavationDepth(dto.getExcavationDepth());
        if (fields.contains("excavationWidth")) entity.setExcavationWidth(dto.getExcavationWidth());
        if (fields.contains("protectiveSystemType")) entity.setProtectiveSystemType(dto.getProtectiveSystemType());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return excRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(ExcavationPermit::getId)
            .orElse(null);
    }
}
