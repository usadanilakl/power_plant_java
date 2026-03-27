package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.mappers.permits.JhaMapper;
import com.dk_power.power_plant_java.repository.permits.JhaRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.JhaSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.JhaMergeService;
import com.dk_power.power_plant_java.sevice.sync.PermitAttachmentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class JhaSharePointSyncable implements SharePointSyncable<JhaDto> {

    private final JhaSharePointAdapter jhaAdapter;
    private final JhaRepo jhaRepo;
    private final WorkRequestRepo workRequestRepo;
    private final JhaMapper jhaMapper;
    private final NgValueService valueService;
    private final JhaMergeService jhaMergeService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;
    private final SharePointFieldMergeService fieldMergeService;
    private final TransactionTemplate transactionTemplate;

    private static final String ENTITY_TYPE = "Jha";
    private static final String LIST_TITLE = "JHA";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("jobName", "JobName"),
        Map.entry("applicability", "Applicability"),
        Map.entry("analysisBy", "AnalysisBy"),
        Map.entry("reviewedBy", "ReviewedBy"),
        Map.entry("approvedBy", "ApprovedBy"),
        Map.entry("date", "Date"),
        Map.entry("ppe", "PPE"),
        Map.entry("loto", "LOTO"),
        Map.entry("confinedSpace", "ConfinedSpace"),
        Map.entry("hazCom", "HazCom"),
        Map.entry("handAndPowerTools", "HandAndPowerTools"),
        Map.entry("specialTools", "SpecialTools"),
        Map.entry("jobSteps", "JobSteps"),
        Map.entry("status", "Status"),
        Map.entry("workRequestSharepointId", "WorkRequestSharepointId"),
        Map.entry("submitterName", "SubmitterName"),
        Map.entry("submitterEmail", "SubmitterEmail"),
        Map.entry("submitterPhone", "SubmitterPhone"),
        Map.entry("submitterCompany", "SubmitterCompany"),
        Map.entry("timeSubmitted", "TimeSubmitted"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<JhaDto> fetchAllFromSharePoint() {
        return jhaAdapter.getAll();
    }

    @Override
    public EntitySyncOutcome processRemoteItem(JhaDto remote, SyncResult result) {
        if (remote.getSharepointId() == null) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);
        JhaSyncDecision decision = transactionTemplate.execute(status ->
            processRemoteItemInTransaction(remote, result, spId, spValues, spModified));

        if (decision == null) {
            result.incrementFailed();
            return EntitySyncOutcome.SKIPPED;
        }

        if (decision.shouldSyncAttachments()) {
            syncAttachmentsSafely(decision.entityId(), spId);
        }

        return decision.outcome();
    }

    @Override
    public String getSharepointId(JhaDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // JHA does not auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        jhaMergeService.mergeIfDuplicatesExist();
    }

    @Override
    public void afterSync(SyncResult result) {
        List<Jha> unlinked = jhaRepo.findAll().stream()
            .filter(j -> j.getWorkRequest() == null && j.getWorkRequestSharepointId() != null
                && !j.getWorkRequestSharepointId().isEmpty())
            .toList();
        for (Jha jha : unlinked) {
            linkToWorkRequest(jha, jha.getWorkRequestSharepointId());
            if (jha.getWorkRequest() != null) {
                jhaRepo.save(jha);
                log.debug("[JHA Syncable] Late-linked JHA {} to WR spId={}",
                    jha.getId(), jha.getWorkRequestSharepointId());
            }
        }
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(JhaDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("JobName", dto.getJobName());
        values.put("Applicability", dto.getApplicability());
        values.put("AnalysisBy", dto.getAnalysisBy());
        values.put("ReviewedBy", dto.getReviewedBy());
        values.put("ApprovedBy", dto.getApprovedBy());
        values.put("Date", dto.getDate());
        values.put("PPE", dto.getPpe());
        values.put("LOTO", dto.getLoto());
        values.put("ConfinedSpace", dto.getConfinedSpace());
        values.put("HazCom", dto.getHazCom());
        values.put("HandAndPowerTools", dto.getHandAndPowerTools());
        values.put("SpecialTools", dto.getSpecialTools());
        values.put("JobSteps", dto.getJobSteps() != null ? dto.getJobSteps().toString() : null);
        values.put("Status", dto.getStatus());
        values.put("WorkRequestSharepointId", dto.getWorkRequestSharepointId());
        values.put("SubmitterName", dto.getSubmitterName());
        values.put("SubmitterEmail", dto.getSubmitterEmail());
        values.put("SubmitterPhone", dto.getSubmitterPhone());
        values.put("SubmitterCompany", dto.getSubmitterCompany());
        values.put("TimeSubmitted", dto.getTimeSubmitted());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(JhaDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, JhaDto dto, Set<String> fields) {
        Jha entity = (Jha) entityObj;
        if (fields.contains("jobName")) entity.setJobName(dto.getJobName());
        if (fields.contains("applicability")) entity.setApplicability(dto.getApplicability());
        if (fields.contains("analysisBy")) entity.setAnalysisBy(dto.getAnalysisBy());
        if (fields.contains("reviewedBy")) entity.setReviewedBy(dto.getReviewedBy());
        if (fields.contains("approvedBy")) entity.setApprovedBy(dto.getApprovedBy());
        if (fields.contains("date") && dto.getDate() != null && !dto.getDate().isEmpty()) {
            try { entity.setDate(LocalDate.parse(dto.getDate())); } catch (Exception ignored) {}
        }
        if (fields.contains("ppe")) entity.setPpe(dto.getPpe());
        if (fields.contains("loto")) entity.setLoto(dto.getLoto());
        if (fields.contains("confinedSpace")) entity.setConfinedSpace(dto.getConfinedSpace());
        if (fields.contains("hazCom")) entity.setHazCom(dto.getHazCom());
        if (fields.contains("handAndPowerTools")) entity.setHandAndPowerTools(dto.getHandAndPowerTools());
        if (fields.contains("specialTools")) entity.setSpecialTools(dto.getSpecialTools());
        if (fields.contains("jobSteps") && dto.getJobSteps() != null) entity.setJobStepsList(dto.getJobSteps());
        if (fields.contains("workRequestSharepointId")) entity.setWorkRequestSharepointId(dto.getWorkRequestSharepointId());
        if (fields.contains("submitterName")) entity.setSubmitterName(dto.getSubmitterName());
        if (fields.contains("submitterEmail")) entity.setSubmitterEmail(dto.getSubmitterEmail());
        if (fields.contains("submitterPhone")) entity.setSubmitterPhone(dto.getSubmitterPhone());
        if (fields.contains("submitterCompany")) entity.setSubmitterCompany(dto.getSubmitterCompany());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        if (fields.contains("timeSubmitted")) entity.setTimeSubmitted(dto.getTimeSubmitted());
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return jhaRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(Jha::getId)
            .orElse(null);
    }

    private void linkToWorkRequest(Jha entity, String workRequestSharepointId) {
        if (workRequestSharepointId == null || workRequestSharepointId.isEmpty()) {
            return;
        }
        entity.setWorkRequestSharepointId(workRequestSharepointId);
        if (entity.getWorkRequest() == null) {
            workRequestRepo.findFirstBySharepointIdOrderByIdAsc(workRequestSharepointId)
                .ifPresent(entity::setWorkRequest);
        }
    }

    private void syncAttachmentsSafely(Long entityId, String sharepointId) {
        try {
            permitAttachmentSyncService.syncAttachmentsForJha(entityId, sharepointId);
        } catch (Exception e) {
            log.warn("[JHA Syncable] Attachment sync failed for spId={}: {}", sharepointId, e.getMessage());
        }
    }

    @Transactional
    protected JhaSyncDecision processRemoteItemInTransaction(
        JhaDto remote,
        SyncResult result,
        String spId,
        Map<String, String> spValues,
        Instant spModified
    ) {
        Jha existing = jhaRepo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);

        if (existing == null) {
            Jha entity = jhaMapper.fromSharePointDto(remote);
            String remoteStatus = remote.getStatus() != null ? remote.getStatus() : "Active";
            entity.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
            entity.setCreatedBy("SharePoint Sync");
            linkToWorkRequest(entity, remote.getWorkRequestSharepointId());
            jhaRepo.save(entity);
            result.incrementCreated();
            log.debug("[JHA Syncable] Created: spId={}", spId);

            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return new JhaSyncDecision(EntitySyncOutcome.CREATED, entity.getId(), true);
        }

        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return new JhaSyncDecision(EntitySyncOutcome.SKIPPED, existing.getId(), true);
        }

        log.debug("[JHA Syncable] spId={} has {} changed SP columns: {}, spModified={}",
            spId, spChangedColumns.size(), spChangedColumns, spModified);

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);

        if (fieldsToApply.isEmpty()) {
            log.debug("[JHA Syncable] spId={}: local wins ALL fields, will re-check next sync", spId);
            return new JhaSyncDecision(EntitySyncOutcome.SKIPPED, existing.getId(), true);
        }

        log.debug("[JHA Syncable] spId={}: SP wins {} fields: {}", spId, fieldsToApply.size(), fieldsToApply);
        applySelectiveFields(existing, remote, fieldsToApply);

        if (fieldsToApply.contains("status")) {
            String remoteStatus = remote.getStatus() != null ? remote.getStatus() : "Active";
            existing.setPermitStatus(valueService.createValue("Permit Status", remoteStatus));
        }

        if (fieldsToApply.contains("workRequestSharepointId")) {
            linkToWorkRequest(existing, remote.getWorkRequestSharepointId());
        }

        jhaRepo.save(existing);
        result.incrementUpdated();
        log.debug("[JHA Syncable] Updated spId={}, applied fields: {}", spId, fieldsToApply);

        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        return new JhaSyncDecision(EntitySyncOutcome.UPDATED, existing.getId(), true);
    }

    private record JhaSyncDecision(EntitySyncOutcome outcome, Long entityId, boolean shouldSyncAttachments) {
    }
}
