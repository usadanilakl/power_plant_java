package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.pwa.PwaWorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharepointAccessService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaWorkRequestService {

    private final SharepointAccessService sharepointAccess;
    private final WorkRequestRepo workRequestRepo;
    private final PermitAttachmentRepo attachmentRepo;
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

        // Save submitter info and timestamp (Central Time is the source of truth)
        String timeSubmitted = ZonedDateTime.now(ZoneId.of("America/Chicago"))
                .format(DateTimeFormatter.ofPattern("MM/dd/yyyy hh:mm a"));
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());
        entity.setSubmitterCompany(dto.getSubmitterCompany());
        entity.setTimeSubmitted(timeSubmitted);
        dto.setTimeSubmitted(timeSubmitted);

        // Save locally first
        workRequestRepo.save(entity);
        log.info("[PWA Submit] Work request saved locally: localUuid={}", dto.getLocalUuid());

        // Save attachments
        if (dto.getAttachments() != null) {
            for (PaAttachmentDto att : dto.getAttachments()) {
                PermitAttachment attachment = new PermitAttachment();
                attachment.setEntityType("WorkRequest");
                attachment.setEntityId(entity.getId());
                attachment.setFileName(att.getFileName());
                attachment.setContentType(att.getContentType());
                attachment.setBase64Content(att.getBase64Content());
                attachment.setAttachmentType(guessAttachmentType(att.getContentType()));
                attachmentRepo.save(attachment);
            }
            log.info("[PWA Submit] Saved {} attachments for localUuid={}", dto.getAttachments().size(), dto.getLocalUuid());
        }

        // Attempt SharePoint submission via fallback chain (Certificate -> Power Automate)
        String sharepointId = null;
        String method = "local";

        try {
            // Check SharePoint for existing item with same PwaId to prevent duplicates
            sharepointId = findExistingSharePointId(dto.getLocalUuid());
            if (sharepointId != null) {
                log.info("[PWA Submit] Duplicate found in SharePoint for PwaId={}, sharepointId={}",
                        dto.getLocalUuid(), sharepointId);
                entity.setSharepointId(sharepointId);
                workRequestRepo.save(entity);
                return PwaSubmissionResult.success("sharepoint", sharepointId, dto.getLocalUuid());
            }

            WorkRequestDto spDto = convertToSharePointDto(dto);
            sharepointId = sharepointAccess.createWorkRequest(spDto);

            if (sharepointId != null) {
                entity.setSharepointId(sharepointId);
                workRequestRepo.save(entity);
                method = "sharepoint";
                log.info("[PWA Submit] Work request created in SharePoint: id={}, localUuid={}",
                        sharepointId, dto.getLocalUuid());

                // Upload attachments to SharePoint
                if (dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            sharepointAccess.addAttachment("WorkRequest", sharepointId, att);
                        } catch (Exception attEx) {
                            log.warn("[PWA Submit] Failed to upload attachment {} to SharePoint: {}",
                                    att.getFileName(), attEx.getMessage());
                        }
                    }
                }
            } else {
                log.warn("[PWA Submit] SharePoint returned null ID for localUuid={}", dto.getLocalUuid());
            }
        } catch (Exception e) {
            log.error("[PWA Submit] Failed to create in SharePoint for localUuid={}: {}",
                    dto.getLocalUuid(), e.getMessage());
            // Item is saved locally - can be synced later
        }

        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    /**
     * Check status by localUuid
     */
    public PwaStatusResult getStatus(String localUuid) {
        return workRequestRepo.findByLocalUuid(localUuid)
                .map(this::toStatusResult)
                .orElse(null);
    }

    private WorkRequestDto convertToSharePointDto(PwaWorkRequestDto dto) {
        WorkRequestDto spDto = new WorkRequestDto();
        spDto.setDateOfWorkToBePerformed(dto.getDateOfWork());
        spDto.setTimeOfWorkToBePerformed(dto.getTimeOfWork());
        spDto.setRequestedBy(dto.getWorkRequestedBy());
        spDto.setCompany(dto.getCompany());
        spDto.setLocation(dto.getLocationOfWork());
        spDto.setAffectedEquipment(dto.getAffectedEquipment());
        spDto.setWorkScope(dto.getWorkScope());
        spDto.setForeman(dto.getForemanName());
        spDto.setFireWatch(dto.getFireWatchName());
        spDto.setBooleanIsLotoRequired(dto.getIsLotoRequired());
        spDto.setBooleanIsHotWorkRequired(dto.getIsHotWorkRequired());
        spDto.setBooleanIsConfinedSpaceEntryRequired(dto.getIsConfinedSpaceEntryRequired());
        spDto.setSpace(dto.getSpaceToBeEntered());
        spDto.setStatus("Active");
        spDto.setLocalUuid(dto.getLocalUuid());
        spDto.setSubmitterName(dto.getSubmitterName());
        spDto.setSubmitterEmail(dto.getSubmitterEmail());
        spDto.setSubmitterPhone(dto.getSubmitterPhone());
        spDto.setSubmitterCompany(dto.getSubmitterCompany());
        spDto.setTimeSubmitted(dto.getTimeSubmitted());
        return spDto;
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

    private String guessAttachmentType(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "photo";
        if (contentType.contains("pdf") || contentType.contains("document")) return "document";
        return "document";
    }

    private String findExistingSharePointId(String localUuid) {
        if (localUuid == null || localUuid.isEmpty()) return null;
        try {
            List<WorkRequestDto> existing = sharepointAccess.getAllWorkRequests();
            return existing.stream()
                    .filter(wr -> localUuid.equals(wr.getLocalUuid()))
                    .map(WorkRequestDto::getSharepointId)
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            log.warn("[PWA Submit] Could not check SharePoint for duplicates: {}", e.getMessage());
            return null;
        }
    }

    private PwaStatusResult toStatusResult(WorkRequest entity) {
        PwaStatusResult result = new PwaStatusResult();
        result.setLocalUuid(entity.getLocalUuid());
        result.setSharepointId(entity.getSharepointId());
        result.setStatus(entity.getPermitStatus() != null ? entity.getPermitStatus().getName() : "Unknown");
        result.setTimeSubmitted(entity.getTimeSubmitted());
        result.setSubmissionMethod(entity.getSharepointId() != null ? "sharepoint" : "local");
        return result;
    }
}
