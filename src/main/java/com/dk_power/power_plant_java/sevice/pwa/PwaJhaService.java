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

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
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

                // Also attach to the Work Request item in SharePoint (prefix with "JHA-" to avoid name collisions)
                String wrSpId = dto.getWorkRequestSharepointId();
                if (wrSpId != null && !wrSpId.isEmpty() && dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            PaAttachmentDto wrAtt = new PaAttachmentDto();
                            wrAtt.setBase64Content(att.getBase64Content());
                            wrAtt.setContentType(att.getContentType());
                            String fn = att.getFileName();
                            wrAtt.setFileName(fn.startsWith("JHA-") ? fn : "JHA-" + fn);
                            wrAdapter.addAttachment(wrSpId, wrAtt);
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
        // Fall back to linking by WorkRequest localUuid
        else if (dto.getWorkRequestLocalUuid() != null && !dto.getWorkRequestLocalUuid().isEmpty()) {
            workRequestRepo.findFirstByLocalUuidOrderByIdAsc(dto.getWorkRequestLocalUuid())
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

    @Transactional
    public void revokeJha(String sharepointId) {
        jhaRepo.findFirstBySharepointIdOrderByIdAsc(sharepointId).ifPresent(entity -> {
            entity.setPermitStatus(valueService.createValue("Permit Status", "Revoked"));
            jhaRepo.save(entity);
            log.info("[PWA JHA Revoke] JHA revoked locally: id={}, spId={}", entity.getId(), sharepointId);
        });
        try {
            jhaAdapter.changeStatus(sharepointId, "Revoked");
            log.info("[PWA JHA Revoke] JHA revoked in SharePoint: spId={}", sharepointId);
        } catch (Exception e) {
            log.warn("[PWA JHA Revoke] Failed to revoke JHA in SharePoint: {}", e.getMessage());
        }
    }

    private String guessAttachmentType(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "photo";
        return "document";
    }
}
