package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.dto.pwa.PwaJhaDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.permits.JhaRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.JhaSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.WorkRequestSharePointAdapter;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaJhaService {

    private final JhaSharePointAdapter jhaAdapter;
    private final WorkRequestSharePointAdapter wrAdapter;
    private final JhaRepo jhaRepo;
    private final WorkRequestRepo workRequestRepo;
    private final PermitAttachmentRepo attachmentRepo;
    private final NgValueService valueService;

    @Transactional
    public PwaSubmissionResult submitJha(PwaJhaDto dto) {
        // Check for duplicate by localUuid
        Optional<Jha> existing = jhaRepo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
        if (existing.isPresent()) {
            log.info("[PWA JHA Submit] Duplicate detected for localUuid={}", dto.getLocalUuid());
            return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
        }

        // Convert DTO to entity
        Jha entity = convertToEntity(dto);
        entity.setLocalUuid(dto.getLocalUuid());
        // Status locally, now - not on the way back from SharePoint. Without this a JHA submitted
        // while SharePoint was unreachable had a null status forever: blank in the desktop table,
        // and missed by every getAllByStatus("Active") query.
        entity.setPermitStatus(valueService.createValue("Permit Status", "Active"));
        String timeSubmitted = ZonedDateTime.now(ZoneId.of("America/Chicago"))
                .format(DateTimeFormatter.ofPattern("MM/dd/yyyy hh:mm a"));
        entity.setTimeSubmitted(timeSubmitted);
        dto.setTimeSubmitted(timeSubmitted);
        entity.setCreatedBy(dto.getSubmitterName() != null ? dto.getSubmitterName() : "PWA");

        // Link to WorkRequest
        linkToWorkRequest(entity, dto);

        // Save submitter info
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());
        entity.setSubmitterCompany(dto.getSubmitterCompany());

        // Save locally first
        entity = jhaRepo.saveAndFlush(entity);
        log.info("[PWA JHA Submit] JHA saved locally: id={}, localUuid={}, deleted={}",
                entity.getId(), dto.getLocalUuid(), entity.getDeleted());

        // Save attachments (content-hash dedup, same guard the work request path uses - without it
        // a replayed submission wrote a second copy of every file)
        if (dto.getAttachments() != null) {
            for (PaAttachmentDto att : dto.getAttachments()) {
                String contentHash = computeContentHash(att.getBase64Content());
                boolean alreadyStored = contentHash != null && !contentHash.isEmpty()
                        ? attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                                "Jha", entity.getId(), att.getFileName(), contentHash)
                        : attachmentRepo.existsByEntityTypeAndEntityIdAndFileName(
                                "Jha", entity.getId(), att.getFileName());
                if (alreadyStored) continue;
                PermitAttachment attachment = new PermitAttachment();
                attachment.setEntityType("Jha");
                attachment.setEntityId(entity.getId());
                attachment.setFileName(att.getFileName());
                attachment.setContentType(att.getContentType());
                attachment.setBase64Content(att.getBase64Content());
                attachment.setAttachmentType(guessAttachmentType(att.getContentType()));
                attachment.setContentHash(contentHash);
                attachmentRepo.save(attachment);
            }
        }

        // Mirror onto the work request LOCALLY, before SharePoint is even attempted. This used to
        // live inside the SharePoint-success branch below, so with SharePoint down the operator
        // opening the work request saw no JHA at all - the one document they need in order to
        // process it. The SharePoint copy is a separate, best-effort concern.
        mirrorAttachmentsToWorkRequest(entity, dto.getAttachments());

        // Attempt SharePoint submission
        String sharepointId = null;
        String method = "local";

        try {
            JhaDto spDto = convertToSharePointDto(dto);
            sharepointId = jhaAdapter.create(spDto);

            if (sharepointId != null) {
                entity.setSharepointId(sharepointId);
                jhaRepo.save(entity);
                method = "sharepoint";
                log.info("[PWA JHA Submit] JHA created in SharePoint: id={}, localUuid={}",
                        sharepointId, dto.getLocalUuid());

                // Upload attachments to JHA item in SharePoint
                if (dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            jhaAdapter.addAttachment(sharepointId, att);
                        } catch (Exception attEx) {
                            log.warn("[PWA JHA Submit] Failed to upload attachment to JHA {}: {}",
                                    att.getFileName(), attEx.getMessage());
                        }
                    }
                }

                // Also attach to the Work Request item in SharePoint (prefix with "JHA-" to avoid
                // name collisions). The local mirror already happened above.
                String wrSpId = resolveWorkRequestSharepointId(entity, dto);
                if (wrSpId != null && !wrSpId.isEmpty() && dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            wrAdapter.addAttachment(wrSpId, prefixedForWorkRequest(att));
                        } catch (Exception attEx) {
                            log.warn("[PWA JHA Submit] Failed to upload attachment to WR {}: {}",
                                    att.getFileName(), attEx.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("[PWA JHA Submit] Failed to create in SharePoint for localUuid={}: {}",
                    dto.getLocalUuid(), e.getMessage());
        }

        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    private void linkToWorkRequest(Jha entity, PwaJhaDto dto) {
        // Try linking by WorkRequest SharePoint ID first
        if (dto.getWorkRequestSharepointId() != null && !dto.getWorkRequestSharepointId().isEmpty()) {
            entity.setWorkRequestSharepointId(dto.getWorkRequestSharepointId());
            workRequestRepo.findFirstBySharepointIdOrderByIdAsc(dto.getWorkRequestSharepointId())
                    .ifPresent(entity::setWorkRequest);
        }
        // Fall back to linking by WorkRequest localUuid (also if SharePoint ID was set but entity not found)
        if (entity.getWorkRequest() == null && dto.getWorkRequestLocalUuid() != null && !dto.getWorkRequestLocalUuid().isEmpty()) {
            workRequestRepo.findFirstByLocalUuidOrderByIdAsc(dto.getWorkRequestLocalUuid())
                    .ifPresent(wr -> {
                        entity.setWorkRequest(wr);
                        if (entity.getWorkRequestSharepointId() == null) {
                            entity.setWorkRequestSharepointId(wr.getSharepointId());
                        }
                    });
        }
    }

    private Jha convertToEntity(PwaJhaDto dto) {
        Jha entity = new Jha();
        entity.setJobName(dto.getJobName());
        entity.setApplicability(dto.getApplicability());
        entity.setAnalysisBy(dto.getAnalysisBy());
        entity.setReviewedBy(dto.getReviewedBy());
        entity.setApprovedBy(dto.getApprovedBy());
        if (dto.getDate() != null && !dto.getDate().isEmpty()) {
            entity.setDate(LocalDate.parse(dto.getDate()));
        }
        entity.setPpe(dto.getPpe());
        entity.setLoto(dto.getLoto());
        entity.setConfinedSpace(dto.getConfinedSpace());
        entity.setHazCom(dto.getHazCom());
        entity.setHandAndPowerTools(dto.getHandAndPowerTools());
        entity.setSpecialTools(dto.getSpecialTools());
        if (dto.getJobSteps() != null) {
            entity.setJobStepsList(dto.getJobSteps());
        }
        return entity;
    }

    private JhaDto convertToSharePointDto(PwaJhaDto dto) {
        JhaDto spDto = new JhaDto();
        spDto.setLocalUuid(dto.getLocalUuid());
        spDto.setJobName(dto.getJobName());
        spDto.setApplicability(dto.getApplicability());
        spDto.setAnalysisBy(dto.getAnalysisBy());
        spDto.setReviewedBy(dto.getReviewedBy());
        spDto.setApprovedBy(dto.getApprovedBy());
        spDto.setDate(dto.getDate());
        spDto.setPpe(dto.getPpe());
        spDto.setLoto(dto.getLoto());
        spDto.setConfinedSpace(dto.getConfinedSpace());
        spDto.setHazCom(dto.getHazCom());
        spDto.setHandAndPowerTools(dto.getHandAndPowerTools());
        spDto.setSpecialTools(dto.getSpecialTools());
        spDto.setJobSteps(dto.getJobSteps());
        spDto.setWorkRequestSharepointId(dto.getWorkRequestSharepointId());
        spDto.setSubmitterName(dto.getSubmitterName());
        spDto.setSubmitterEmail(dto.getSubmitterEmail());
        spDto.setSubmitterPhone(dto.getSubmitterPhone());
        spDto.setSubmitterCompany(dto.getSubmitterCompany());
        spDto.setTimeSubmitted(dto.getTimeSubmitted());
        return spDto;
    }

    /**
     * Revoke by SharePoint id, PWA local id, or both.
     *
     * <p>A JHA submitted while SharePoint was unreachable has no SharePoint id at all, and the old
     * signature could not name it - so the requester could not withdraw their own submission. The
     * local id identifies it either way; the SharePoint call is skipped when there is nothing there
     * to update.
     */
    @Transactional
    public void revokeJha(String sharepointId, String localUuid) {
        Optional<Jha> found = Optional.empty();
        if (sharepointId != null && !sharepointId.isEmpty()) {
            found = jhaRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId);
        }
        if (found.isEmpty() && localUuid != null && !localUuid.isEmpty()) {
            found = jhaRepo.findFirstByLocalUuidOrderByIdAsc(localUuid);
        }

        Jha entity = found.orElseThrow(() -> new IllegalArgumentException(
                "JHA not found for sharepointId=" + sharepointId + " or localUuid=" + localUuid));

        entity.setPermitStatus(valueService.createValue("Permit Status", "Revoked"));
        jhaRepo.save(entity);
        log.info("[PWA JHA Revoke] JHA revoked locally: id={}, spId={}", entity.getId(), entity.getSharepointId());

        String spId = entity.getSharepointId() != null ? entity.getSharepointId() : sharepointId;
        if (spId == null || spId.isEmpty()) {
            log.info("[PWA JHA Revoke] JHA id={} has no SharePoint item to revoke", entity.getId());
            return;
        }
        try {
            jhaAdapter.changeStatus(spId, "Revoked");
            log.info("[PWA JHA Revoke] JHA revoked in SharePoint: spId={}", spId);
        } catch (Exception e) {
            log.warn("[PWA JHA Revoke] Failed to revoke JHA in SharePoint: {}", e.getMessage());
        }
    }

    private String guessAttachmentType(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "photo";
        return "document";
    }

    /** "JHA-"-prefixed copy of an attachment, so it does not collide with the WR's own files. */
    private PaAttachmentDto prefixedForWorkRequest(PaAttachmentDto att) {
        PaAttachmentDto wrAtt = new PaAttachmentDto();
        wrAtt.setBase64Content(att.getBase64Content());
        wrAtt.setContentType(att.getContentType());
        String fn = att.getFileName();
        wrAtt.setFileName(fn != null && fn.startsWith("JHA-") ? fn : "JHA-" + fn);
        return wrAtt;
    }

    /**
     * Copy the JHA's files onto its work request in the local database. Resolved through the FK the
     * entity already carries, so it works for a request that has no SharePoint id yet.
     */
    private void mirrorAttachmentsToWorkRequest(Jha jha, List<PaAttachmentDto> attachments) {
        if (attachments == null || attachments.isEmpty()) return;
        com.dk_power.power_plant_java.entities.permits.WorkRequest wr = jha.getWorkRequest();
        if (wr == null) {
            log.debug("[PWA JHA Submit] JHA id={} is not linked to a local WR - nothing to mirror", jha.getId());
            return;
        }
        for (PaAttachmentDto att : attachments) {
            try {
                saveWorkRequestAttachment(wr.getId(), prefixedForWorkRequest(att));
            } catch (Exception e) {
                log.warn("[PWA JHA Submit] Failed to mirror attachment {} onto WR {}: {}",
                        att.getFileName(), wr.getId(), e.getMessage());
            }
        }
    }

    /** The work request's SharePoint id, preferring the linked entity over whatever the DTO claimed. */
    private String resolveWorkRequestSharepointId(Jha jha, PwaJhaDto dto) {
        if (jha.getWorkRequest() != null && jha.getWorkRequest().getSharepointId() != null) {
            return jha.getWorkRequest().getSharepointId();
        }
        return dto.getWorkRequestSharepointId();
    }

    private void saveWorkRequestAttachment(Long wrId, PaAttachmentDto wrAttachment) {
        if (wrId == null || wrAttachment == null) {
            return;
        }

        String fileName = wrAttachment.getFileName();
        String contentHash = computeContentHash(wrAttachment.getBase64Content());

        boolean exists = contentHash != null && !contentHash.isEmpty()
            ? attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash("WorkRequest", wrId, fileName, contentHash)
            : attachmentRepo.existsByEntityTypeAndEntityIdAndFileName("WorkRequest", wrId, fileName);

        if (exists) {
            return;
        }

        PermitAttachment localWrAttachment = new PermitAttachment();
        localWrAttachment.setEntityType("WorkRequest");
        localWrAttachment.setEntityId(wrId);
        localWrAttachment.setFileName(fileName);
        localWrAttachment.setContentType(wrAttachment.getContentType());
        localWrAttachment.setBase64Content(wrAttachment.getBase64Content());
        localWrAttachment.setAttachmentType(guessAttachmentType(wrAttachment.getContentType()));
        localWrAttachment.setContentHash(contentHash);
        attachmentRepo.save(localWrAttachment);
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
                log.warn("[PWA JHA Submit] Could not hash attachment payload: {}", hashError.getMessage());
                return null;
            }
        }
    }
}
