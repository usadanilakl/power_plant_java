package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.repository.permits.SafeWorkRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SafeWorkSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.SafeWorkMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class SafeWorkSharePointSyncable implements SharePointSyncable<SafeWorkDto> {

    private final SafeWorkSharePointAdapter safeWorkAdapter;
    private final SafeWorkRepo safeWorkRepo;
    private final NgValueService valueService;
    private final SafeWorkMergeService safeWorkMergeService;
    private final SharePointFieldMergeService fieldMergeService;

    private static final String ENTITY_TYPE = "SafeWork";
    private static final String LIST_TITLE = "Safe Work Permits";

    /** Entity field name → SP column name. */
    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("workScope", "Title"),
        Map.entry("date", "Date"),
        Map.entry("time", "Time"),
        Map.entry("companyPerson", "CompanyPerson"),
        Map.entry("location", "LocationOfWork"),
        Map.entry("specialInstructions", "SpecialInstructions"),
        Map.entry("requestedBy", "RequestedBy"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<SafeWorkDto> fetchAllFromSharePoint() {
        return safeWorkAdapter.getAll();
    }

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(SafeWorkDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        SafeWork existing = safeWorkRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            // New — create with all fields
            SafeWork entity = new SafeWork();
            entity.setWorkScope(remote.getWorkScope());
            entity.setDate(remote.getDate());
            entity.setTime(remote.getTime());
            entity.setCompanyPerson(remote.getCompanyPerson());
            entity.setLocation(remote.getLocation());
            entity.setSpecialInstructions(remote.getSpecialInstructions());
            entity.setRequestedBy(remote.getRequestedBy());
            entity.setSharepointId(remote.getSharepointId());
            entity.setLocalUuid(remote.getLocalUuid());

            String remoteStatus = remote.getPermitStatus() != null
                    ? remote.getPermitStatus().getName() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            entity.setCreatedBy("SharePoint Sync");
            safeWorkRepo.save(entity);
            result.incrementCreated();
            log.debug("[SW Syncable] Created: spId={}", spId);

            // Save initial snapshot
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.CREATED;
        }

        // Existing — field-level merge
        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        log.info("[SW Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.info("[SW Syncable] spId={}: local wins ALL fields — entity unchanged, will re-check next sync", spId);
            return EntitySyncOutcome.SKIPPED;
        }

        log.info("[SW Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        safeWorkRepo.save(existing);
        result.incrementUpdated();
        log.info("[SW Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return EntitySyncOutcome.UPDATED;
    }

    @Override
    public String getSharepointId(SafeWorkDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // SafeWork does not auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        safeWorkMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(SafeWorkDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getWorkScope());
        values.put("Date", dto.getDate());
        values.put("Time", dto.getTime());
        values.put("CompanyPerson", dto.getCompanyPerson());
        values.put("LocationOfWork", dto.getLocation());
        values.put("SpecialInstructions", dto.getSpecialInstructions());
        values.put("RequestedBy", dto.getRequestedBy());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(SafeWorkDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, SafeWorkDto dto, Set<String> fields) {
        SafeWork entity = (SafeWork) entityObj;
        if (fields.contains("workScope")) entity.setWorkScope(dto.getWorkScope());
        if (fields.contains("date")) entity.setDate(dto.getDate());
        if (fields.contains("time")) entity.setTime(dto.getTime());
        if (fields.contains("companyPerson")) entity.setCompanyPerson(dto.getCompanyPerson());
        if (fields.contains("location")) entity.setLocation(dto.getLocation());
        if (fields.contains("specialInstructions")) entity.setSpecialInstructions(dto.getSpecialInstructions());
        if (fields.contains("requestedBy")) entity.setRequestedBy(dto.getRequestedBy());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return safeWorkRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(SafeWork::getId)
            .orElse(null);
    }
}
