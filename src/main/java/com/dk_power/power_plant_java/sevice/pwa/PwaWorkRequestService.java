package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.pwa.PwaWorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharepointAccessService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaWorkRequestService {

    private final SharepointAccessService sharepointAccess;
    private final WorkRequestRepo workRequestRepo;
    private final NgValueService valueService;

    /**
     * Submit work request from PWA.
     * 1. Check for duplicate by localUuid
     * 2. Save to local DB
     * 3. Attempt SharePoint submission (via SharepointAccessService fallback chain)
     */
    @Transactional
    public PwaSubmissionResult submitWorkRequest(PwaWorkRequestDto dto) {
        // Check for duplicate by localUuid
        Optional<WorkRequest> existing = workRequestRepo.findByLocalUuid(dto.getLocalUuid());
        if (existing.isPresent()) {
            log.info("[PWA Submit] Duplicate detected for localUuid={}", dto.getLocalUuid());
            return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
        }

        // Convert DTO to entity
        WorkRequest entity = convertToEntity(dto);
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setPermitStatus(valueService.createValue("Permit Status", "Active"));

        // Save submitter info
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());
        entity.setSubmitterCompany(dto.getSubmitterCompany());

        // Save locally first
        workRequestRepo.save(entity);
        log.info("[PWA Submit] Work request saved locally: localUuid={}", dto.getLocalUuid());

        // TODO: Implement SharePoint create via SharepointAccessService
        // For now, the scheduled sync will pick up records without sharepointId
        // and attempt to create them in SharePoint

        return PwaSubmissionResult.success("local", null, dto.getLocalUuid());
    }

    /**
     * Check status by localUuid
     */
    public PwaStatusResult getStatus(String localUuid) {
        return workRequestRepo.findByLocalUuid(localUuid)
                .map(this::toStatusResult)
                .orElse(null);
    }

    private WorkRequest convertToEntity(PwaWorkRequestDto dto) {
        WorkRequest entity = new WorkRequest();
        entity.setCompany(dto.getCompany());
        entity.setDateOfWorkToBePerformed(dto.getDateOfWork());
        entity.setTimeOfWorkToBePerformed(dto.getTimeOfWork());
        entity.setLocation(dto.getLocationOfWork());
        entity.setRequestedBy(dto.getWorkRequestedBy());
        entity.setAffectedEquipment(dto.getAffectedEquipment());
        entity.setWorkScope(dto.getWorkScope());
        entity.setIsLotoRequired(dto.getIsLotoRequired());
        entity.setIsHotWorkRequired(dto.getIsHotWorkRequired());
        entity.setIsConfinedSpaceEntryRequired(dto.getIsConfinedSpaceEntryRequired());
        entity.setForeman(dto.getForemanName());
        entity.setFireWatch(dto.getFireWatchName());
        entity.setSpace(dto.getSpaceToBeEntered());
        return entity;
    }

    private PwaStatusResult toStatusResult(WorkRequest entity) {
        PwaStatusResult result = new PwaStatusResult();
        result.setLocalUuid(entity.getLocalUuid());
        result.setSharepointId(entity.getSharepointId());
        result.setStatus(entity.getPermitStatus() != null ? entity.getPermitStatus().getName() : "Unknown");
        result.setSubmittedAt(entity.getDateCreated());
        result.setSubmissionMethod(entity.getSharepointId() != null ? "sharepoint" : "local");
        return result;
    }
}
