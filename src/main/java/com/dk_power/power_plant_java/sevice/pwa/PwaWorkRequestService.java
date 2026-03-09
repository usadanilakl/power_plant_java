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
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaWorkRequestService {

    private final WorkRequestSharePointAdapter wrAdapter;
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
        Optional<WorkRequest> existing = workRequestRepo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
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
        entity = workRequestRepo.saveAndFlush(entity);
        log.info("[PWA Submit] Work request saved locally: id={}, localUuid={}, deleted={}",
                entity.getId(), dto.getLocalUuid(), entity.getDeleted());

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
                attachment.setContentHash(computeContentHash(att.getBase64Content()));
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
            sharepointId = wrAdapter.create(spDto);

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
                            wrAdapter.addAttachment(sharepointId, att);
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
        return workRequestRepo.findFirstByLocalUuidOrderByIdAsc(localUuid)
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
            List<WorkRequestDto> existing = wrAdapter.getAll();
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

    @Transactional
    public void revokeWorkRequest(String sharepointId) {
        workRequestRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId).ifPresent(entity -> {
            entity.setPermitStatus(valueService.createValue("Permit Status", "Revoked"));
            workRequestRepo.save(entity);
            log.info("[PWA Revoke] WR revoked locally: id={}, spId={}", entity.getId(), sharepointId);
        });
        try {
            wrAdapter.changeStatus(sharepointId, "Revoked");
            log.info("[PWA Revoke] WR revoked in SharePoint: spId={}", sharepointId);
        } catch (Exception e) {
            log.warn("[PWA Revoke] Failed to revoke WR in SharePoint: {}", e.getMessage());
        }
    }

    @Transactional
    public PwaSubmissionResult updateWorkRequest(PwaWorkRequestDto dto) {
        String localUuid = dto.getLocalUuid();
        String sharepointId = dto.getSharepointId();

        // Look up by localUuid first, then fall back to sharepointId
        Optional<WorkRequest> found = Optional.empty();
        if (localUuid != null && !localUuid.isEmpty()) {
            found = workRequestRepo.findFirstByLocalUuidOrderByIdAsc(localUuid);
        }
        if (found.isEmpty() && sharepointId != null && !sharepointId.isEmpty()) {
            found = workRequestRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId);
            log.info("[PWA Update] localUuid lookup missed, found by sharepointId={}", sharepointId);
        }

        WorkRequest entity = found.orElseThrow(() ->
                new IllegalArgumentException("Work request not found for localUuid=" + localUuid + " or sharepointId=" + sharepointId));

        // Update entity fields
        updateEntityFields(entity, dto);

        // Mark as Updated so operator knows the WR has been modified
        String currentStatus = entity.getPermitStatus() != null ? entity.getPermitStatus().getName() : "";
        if ("Active".equalsIgnoreCase(currentStatus) || "Processed".equalsIgnoreCase(currentStatus)) {
            entity.setPermitStatus(valueService.createValue("Permit Status", "Updated"));
            log.info("[PWA Update] WR was {}, marking as Updated: id={}", currentStatus, entity.getId());
        }

        entity = workRequestRepo.saveAndFlush(entity);
        log.info("[PWA Update] WR updated locally: id={}, localUuid={}", entity.getId(), localUuid);

        // Save new attachments to DB
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            for (PaAttachmentDto att : dto.getAttachments()) {
                PermitAttachment attachment = new PermitAttachment();
                attachment.setEntityType("WorkRequest");
                attachment.setEntityId(entity.getId());
                attachment.setFileName(att.getFileName());
                attachment.setContentType(att.getContentType());
                attachment.setBase64Content(att.getBase64Content());
                attachment.setAttachmentType(guessAttachmentType(att.getContentType()));
                attachment.setContentHash(computeContentHash(att.getBase64Content()));
                attachmentRepo.save(attachment);
            }
            log.info("[PWA Update] Saved {} new attachments for localUuid={}", dto.getAttachments().size(), localUuid);
        }

        // Push to SharePoint
        String entitySpId = entity.getSharepointId();
        if (entitySpId != null && !entitySpId.isEmpty()) {
            try {
                WorkRequestDto spDto = convertToSharePointDto(dto);
                spDto.setStatus(entity.getPermitStatus() != null ? entity.getPermitStatus().getName() : "Active");
                wrAdapter.update(entitySpId, spDto);
                log.info("[PWA Update] WR updated in SharePoint: spId={}", entitySpId);

                // Upload new attachments to SharePoint
                if (dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            wrAdapter.addAttachment(entitySpId, att);
                        } catch (Exception attEx) {
                            log.warn("[PWA Update] Failed to upload attachment {} to SharePoint: {}",
                                    att.getFileName(), attEx.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("[PWA Update] Failed to update WR in SharePoint: {}", e.getMessage());
            }
        }

        return PwaSubmissionResult.success(
                entitySpId != null ? "sharepoint" : "local", entitySpId, entity.getLocalUuid());
    }

    private void updateEntityFields(WorkRequest entity, PwaWorkRequestDto dto) {
        if (dto.getCompany() != null) entity.setCompany(dto.getCompany());
        if (dto.getDateOfWork() != null) entity.setDateOfWorkToBePerformed(dto.getDateOfWork());
        if (dto.getTimeOfWork() != null) entity.setTimeOfWorkToBePerformed(dto.getTimeOfWork());
        if (dto.getLocationOfWork() != null) entity.setLocation(dto.getLocationOfWork());
        if (dto.getWorkRequestedBy() != null) entity.setRequestedBy(dto.getWorkRequestedBy());
        if (dto.getAffectedEquipment() != null) entity.setAffectedEquipment(dto.getAffectedEquipment());
        if (dto.getWorkScope() != null) entity.setWorkScope(dto.getWorkScope());
        if (dto.getForemanName() != null) entity.setForeman(dto.getForemanName());
        if (dto.getFireWatchName() != null) entity.setFireWatch(dto.getFireWatchName());
        if (dto.getSpaceToBeEntered() != null) entity.setSpace(dto.getSpaceToBeEntered());
        entity.setIsLotoRequired(dto.getIsLotoRequired());
        entity.setIsHotWorkRequired(dto.getIsHotWorkRequired());
        entity.setIsConfinedSpaceEntryRequired(dto.getIsConfinedSpaceEntryRequired());
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

    private String computeContentHash(String base64Content) {
        if (base64Content == null || base64Content.isEmpty()) {
            return null;
        }

        try {
            byte[] bytes = java.util.Base64.getDecoder().decode(base64Content);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception decodeError) {
            try {
                byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(base64Content.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder(hash.length * 2);
                for (byte b : hash) {
                    sb.append(String.format("%02x", b));
                }
                return sb.toString();
            } catch (Exception hashError) {
                log.warn("[PWA Submit] Could not hash attachment payload: {}", hashError.getMessage());
                return null;
            }
        }
    }
}
