package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.permits.JhaDto;
import com.dk_power.power_plant_java.dto.pwa.PwaJhaDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.permits.JhaRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.SharepointAccessService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaJhaService {

    private final SharepointAccessService sharepointAccess;
    private final JhaRepo jhaRepo;
    private final WorkRequestRepo workRequestRepo;
    private final PermitAttachmentRepo attachmentRepo;

    @Transactional
    public PwaSubmissionResult submitJha(PwaJhaDto dto) {
        // Check for duplicate by localUuid
        Optional<Jha> existing = jhaRepo.findByLocalUuid(dto.getLocalUuid());
        if (existing.isPresent()) {
            log.info("[PWA JHA Submit] Duplicate detected for localUuid={}", dto.getLocalUuid());
            return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
        }

        // Convert DTO to entity
        Jha entity = convertToEntity(dto);
        entity.setLocalUuid(dto.getLocalUuid());
        ZonedDateTime centralNow = ZonedDateTime.now(ZoneId.of("America/Chicago"));
        entity.setSubmittedAt(centralNow.toLocalDateTime());
        entity.setDeleted(false);

        // Link to WorkRequest
        linkToWorkRequest(entity, dto);

        // Save submitter info
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());
        entity.setSubmitterCompany(dto.getSubmitterCompany());

        // Save locally first
        jhaRepo.save(entity);
        log.info("[PWA JHA Submit] JHA saved locally: localUuid={}", dto.getLocalUuid());

        // Save attachments
        if (dto.getAttachments() != null) {
            for (PaAttachmentDto att : dto.getAttachments()) {
                PermitAttachment attachment = new PermitAttachment();
                attachment.setEntityType("Jha");
                attachment.setEntityId(entity.getId());
                attachment.setFileName(att.getFileName());
                attachment.setContentType(att.getContentType());
                attachment.setBase64Content(att.getBase64Content());
                attachment.setAttachmentType(guessAttachmentType(att.getContentType()));
                attachmentRepo.save(attachment);
            }
        }

        // Attempt SharePoint submission
        String sharepointId = null;
        String method = "local";

        try {
            JhaDto spDto = convertToSharePointDto(dto);
            sharepointId = sharepointAccess.createJha(spDto);

            if (sharepointId != null) {
                entity.setSharepointId(sharepointId);
                jhaRepo.save(entity);
                method = "sharepoint";
                log.info("[PWA JHA Submit] JHA created in SharePoint: id={}, localUuid={}",
                        sharepointId, dto.getLocalUuid());

                // Upload attachments to SharePoint
                if (dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            sharepointAccess.addAttachment("Jha", sharepointId, att);
                        } catch (Exception attEx) {
                            log.warn("[PWA JHA Submit] Failed to upload attachment {}: {}",
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
            workRequestRepo.findBySharepointId(dto.getWorkRequestSharepointId())
                    .ifPresent(entity::setWorkRequest);
        }
        // Fall back to linking by WorkRequest localUuid
        else if (dto.getWorkRequestLocalUuid() != null && !dto.getWorkRequestLocalUuid().isEmpty()) {
            workRequestRepo.findByLocalUuid(dto.getWorkRequestLocalUuid())
                    .ifPresent(wr -> {
                        entity.setWorkRequest(wr);
                        entity.setWorkRequestSharepointId(wr.getSharepointId());
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
            entity.setJobSteps(dto.getJobSteps());
        }
        return entity;
    }

    private JhaDto convertToSharePointDto(PwaJhaDto dto) {
        JhaDto spDto = new JhaDto();
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
        return spDto;
    }

    private String guessAttachmentType(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "photo";
        return "document";
    }
}
