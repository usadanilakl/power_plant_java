package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.pwa.PwaWorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgJobLogService;
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
import java.util.ArrayList;
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
    private final WorkAreaRepo workAreaRepo;
    private final NgJobLogService ngJobLogService;

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

        // Record which job this request LOOKS like it belongs to. A hint for the operator - it does
        // not attach anything and does not change the status.
        recordJobSuggestion(entity);

        // Save attachments (with dedup by content hash)
        List<PaAttachmentDto> newAttachments = persistNewAttachments(entity.getId(), dto.getAttachments(), "PWA Submit");

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
                uploadAttachments(sharepointId, newAttachments, "PWA Submit");
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
        spDto.setWorkCategoryName(dto.getWorkCategoryName());
        spDto.setDeclaredHazards(com.dk_power.power_plant_java.entities.permits.pojo.DeclaredHazards.toJson(
                dto.getDeclaredHazards(), dto.getDeclaredHotWorkMeasures(),
                dto.getDeclaredConfinedSpaceHazards(), dto.getHotWorkProfile()));
        if (dto.getWorkAreaId() != null) {
            workAreaRepo.findById(dto.getWorkAreaId()).ifPresent(workArea -> spDto.setWorkAreaName(workArea.getName()));
        }
        if (spDto.getWorkAreaName() == null && dto.getWorkAreaName() != null && !dto.getWorkAreaName().isBlank()) {
            spDto.setWorkAreaName(dto.getWorkAreaName());
        }
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

        // Resolve workArea from ID, fall back to name if ID is stale
        if (dto.getWorkAreaId() != null) {
            workAreaRepo.findById(dto.getWorkAreaId()).ifPresent(entity::setWorkArea);
        }
        if (entity.getWorkArea() == null && dto.getWorkAreaName() != null && !dto.getWorkAreaName().isBlank()) {
            workAreaRepo.findFirstByNameIgnoreCase(dto.getWorkAreaName()).ifPresent(entity::setWorkArea);
        }

        // Resolve workCategory from name
        if (dto.getWorkCategoryName() != null && !dto.getWorkCategoryName().isBlank()) {
            entity.setWorkCategory(valueService.createValue("Work Category", dto.getWorkCategoryName()));
        }

        applyDeclaredHazards(entity, dto);

        return entity;
    }

    /**
     * Null means "this payload carries no opinion", so an older PWA build - or the Power Automate
     * path, which has no hazard columns - cannot blank out a declaration by staying silent. A
     * requester who ticks nothing sends an all-false object, which is a real answer and is stored.
     */
    private void applyDeclaredHazards(WorkRequest entity, PwaWorkRequestDto dto) {
        if (dto.getDeclaredHazards() != null) {
            entity.setDeclaredHazards(dto.getDeclaredHazards());
        }
        if (dto.getDeclaredHotWorkMeasures() != null) {
            entity.setDeclaredHotWorkMeasures(dto.getDeclaredHotWorkMeasures());
        }
        if (dto.getDeclaredConfinedSpaceHazards() != null) {
            entity.setDeclaredConfinedSpaceHazards(dto.getDeclaredConfinedSpaceHazards());
        }
        if (dto.getHotWorkProfile() != null) {
            entity.setHotWorkProfile(dto.getHotWorkProfile());
        }
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
            WorkRequestDto existing = wrAdapter.findByLocalUuid(localUuid);
            return existing != null ? existing.getSharepointId() : null;
        } catch (Exception e) {
            log.warn("[PWA Submit] Could not check SharePoint for duplicates: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Persist the attachments this call actually adds, and return them. Content-hash dedup means a
     * replayed payload writes nothing new - and the returned list is what SharePoint should
     * receive, so the two stores stay in step instead of SharePoint accumulating a fresh copy of
     * every existing file each time the requester edits.
     */
    private List<PaAttachmentDto> persistNewAttachments(Long entityId, List<PaAttachmentDto> incoming, String logTag) {
        if (incoming == null || incoming.isEmpty()) return List.of();

        List<PaAttachmentDto> added = new ArrayList<>();
        for (PaAttachmentDto att : incoming) {
            String contentHash = computeContentHash(att.getBase64Content());
            boolean alreadyStored = contentHash != null && !contentHash.isEmpty()
                    ? attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                            "WorkRequest", entityId, att.getFileName(), contentHash)
                    : attachmentRepo.existsByEntityTypeAndEntityIdAndFileName(
                            "WorkRequest", entityId, att.getFileName());
            if (alreadyStored) {
                log.debug("[{}] Skipping attachment already stored: {}", logTag, att.getFileName());
                continue;
            }
            PermitAttachment attachment = new PermitAttachment();
            attachment.setEntityType("WorkRequest");
            attachment.setEntityId(entityId);
            attachment.setFileName(att.getFileName());
            attachment.setContentType(att.getContentType());
            attachment.setBase64Content(att.getBase64Content());
            attachment.setAttachmentType(guessAttachmentType(att.getContentType()));
            attachment.setContentHash(contentHash);
            attachmentRepo.save(attachment);
            added.add(att);
        }
        log.info("[{}] Saved {} attachment(s) ({} already stored) for WR id={}",
                logTag, added.size(), incoming.size() - added.size(), entityId);
        return added;
    }

    /** Best-effort SharePoint upload; a failed file is logged, never fatal to the submission. */
    private void uploadAttachments(String sharepointId, List<PaAttachmentDto> attachments, String logTag) {
        if (sharepointId == null || sharepointId.isEmpty() || attachments == null) return;
        for (PaAttachmentDto att : attachments) {
            try {
                wrAdapter.addAttachment(sharepointId, att);
            } catch (Exception e) {
                log.warn("[{}] Failed to upload attachment {} to SharePoint: {}",
                        logTag, att.getFileName(), e.getMessage());
            }
        }
    }

    /**
     * Revoke by SharePoint id, PWA local id, or both.
     *
     * <p>A request the hub accepted while SharePoint was unreachable has no SharePoint id, and the
     * old signature could not name it — the requester could not withdraw their own submission. The
     * local id identifies it either way; the SharePoint call is skipped when there is nothing there.
     */
    @Transactional
    public void revokeWorkRequest(String sharepointId, String localUuid) {
        Optional<WorkRequest> found = Optional.empty();
        if (sharepointId != null && !sharepointId.isEmpty()) {
            found = workRequestRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId);
        }
        if (found.isEmpty() && localUuid != null && !localUuid.isEmpty()) {
            found = workRequestRepo.findFirstByLocalUuidOrderByIdAsc(localUuid);
        }

        WorkRequest entity = found.orElseThrow(() -> new IllegalArgumentException(
                "Work request not found for sharepointId=" + sharepointId + " or localUuid=" + localUuid));

        entity.setPermitStatus(valueService.createValue("Permit Status", "Revoked"));
        workRequestRepo.save(entity);
        log.info("[PWA Revoke] WR revoked locally: id={}, spId={}", entity.getId(), entity.getSharepointId());

        String spId = entity.getSharepointId() != null ? entity.getSharepointId() : sharepointId;
        if (spId == null || spId.isEmpty()) {
            log.info("[PWA Revoke] WR id={} has no SharePoint item to revoke", entity.getId());
            return;
        }
        try {
            wrAdapter.changeStatus(spId, "Revoked");
            log.info("[PWA Revoke] WR revoked in SharePoint: spId={}", spId);
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

        // Save new attachments to DB (with dedup by content hash)
        List<PaAttachmentDto> newAttachments = persistNewAttachments(entity.getId(), dto.getAttachments(), "PWA Update");

        // Push to SharePoint
        String entitySpId = entity.getSharepointId();
        if (entitySpId != null && !entitySpId.isEmpty()) {
            try {
                WorkRequestDto spDto = convertToSharePointDto(dto);
                spDto.setStatus(entity.getPermitStatus() != null ? entity.getPermitStatus().getName() : "Active");
                // A payload that carries no declaration means "no opinion" everywhere else in this
                // flow, so it must not blank the SharePoint copy either. Falling back to what the
                // entity already holds keeps the two stores saying the same thing when an older PWA
                // build - or the update half of a partial payload - omits the hazard blocks.
                if (spDto.getDeclaredHazards() == null) {
                    spDto.setDeclaredHazards(entity.getDeclaredHazardsEnvelope());
                }
                wrAdapter.update(entitySpId, spDto);
                log.info("[PWA Update] WR updated in SharePoint: spId={}", entitySpId);

                // Upload only the attachments this save actually added. The edit form round-trips
                // every existing attachment, so pushing dto.getAttachments() wholesale re-uploaded
                // the entire set on every edit, and SharePoint, which does not dedup, kept them all.
                uploadAttachments(entitySpId, newAttachments, "PWA Update");
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
        if (dto.getWorkAreaId() != null) {
            workAreaRepo.findById(dto.getWorkAreaId()).ifPresent(entity::setWorkArea);
        } else if (dto.getWorkAreaName() != null && !dto.getWorkAreaName().isBlank()) {
            workAreaRepo.findFirstByNameIgnoreCase(dto.getWorkAreaName()).ifPresentOrElse(
                    entity::setWorkArea,
                    () -> entity.setWorkArea(null)
            );
        } else {
            entity.setWorkArea(null);
        }
        if (dto.getWorkCategoryName() != null && !dto.getWorkCategoryName().isBlank()) {
            entity.setWorkCategory(valueService.createValue("Work Category", dto.getWorkCategoryName()));
        } else {
            entity.setWorkCategory(null);
        }
        applyDeclaredHazards(entity, dto);
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

    /**
     * Note which open job this request most likely belongs to, and stop there.
     *
     * <p>This used to run the operator's full process-into-a-job routine at submission time, which
     * created a job and a daily permit package and flipped the request straight to "Processed" —
     * before any operator had seen it. Two things went wrong with that. Requests that reached us
     * through SharePoint instead of the hub were never auto-linked, so the same contractor action
     * produced a different lifecycle depending on whether the hub happened to be up. And once a
     * request already had a package, the operator's "Create New Job" button silently bound it back
     * to the old job anyway, leaving a stray empty job behind.
     *
     * <p>So the match is recorded as a hint and the request stays "Active". The Process dialog is
     * now the only place a request joins a job, and it shows this suggestion pre-selected.
     */
    private void recordJobSuggestion(WorkRequest wr) {
        if (wr.getWorkArea() == null || wr.getWorkCategory() == null || wr.getCompany() == null) {
            log.debug("[PWA] WR {} has no work area / category / company — no job suggestion", wr.getId());
            return;
        }
        try {
            ngJobLogService.findSuggestedJob(wr).ifPresent(job -> {
                wr.setSuggestedJobLogId(job.getId());
                workRequestRepo.save(wr);
                log.info("[PWA] WR {} suggests Job {} ({})", wr.getId(), job.getId(), job.getPermitNumber());
            });
        } catch (Exception e) {
            log.warn("[PWA] Job suggestion failed for WR {}: {}", wr.getId(), e.getMessage());
            // Non-fatal — it is only a hint; the operator picks the job either way.
        }
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
