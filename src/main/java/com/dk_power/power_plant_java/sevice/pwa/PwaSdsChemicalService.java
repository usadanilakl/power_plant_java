package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSdsChemicalDto;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher;
import com.dk_power.power_plant_java.sevice.angular.sds.NgSdsChemicalService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsChemicalSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaSdsChemicalService {

    private final SdsChemicalSharePointAdapter spAdapter;
    private final SdsChemicalRepo repo;
    private final SdsChemicalMapper mapper;
    private final PermitAttachmentRepo attachmentRepo;
    private final NgValueService valueService;
    private final ObjectProvider<WorkAreaGitHubPublisher> gitHubPublisherProvider;

    private void publishToPwaSnapshot() {
        WorkAreaGitHubPublisher publisher = gitHubPublisherProvider.getIfAvailable();
        if (publisher != null) publisher.publishSdsChemicals();
    }

    @Transactional
    public PwaSubmissionResult submitSdsChemical(PwaSdsChemicalDto dto) {
        Optional<SdsChemical> existing = repo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
        if (existing.isPresent()) {
            log.info("[PWA SDS] Duplicate detected for localUuid={}", dto.getLocalUuid());
            return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
        }

        SdsChemical entity = new SdsChemical();
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setNames(dto.getNames());
        entity.setLocations(dto.getLocations());
        entity.setNotes(dto.getNotes());
        entity.setProcessedByName(dto.getProcessedByName());
        entity.setProcessedByEmail(dto.getProcessedByEmail());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());
        entity.setStatus(valueService.createValue(NgSdsChemicalService.STATUS_CATEGORY,
                dto.getStatusName() != null ? dto.getStatusName() : NgSdsChemicalService.STATUS_PENDING));

        entity = repo.saveAndFlush(entity);
        log.info("[PWA SDS] Saved locally: id={}, localUuid={}", entity.getId(), dto.getLocalUuid());

        // Save attachments with dedup (the SDS PDF)
        if (dto.getAttachments() != null) {
            for (PaAttachmentDto att : dto.getAttachments()) {
                String contentHash = computeContentHash(att.getBase64Content());
                if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                        SdsChemicalMapper.ENTITY_TYPE, entity.getId(), att.getFileName(), contentHash)) {
                    continue;
                }
                PermitAttachment attachment = new PermitAttachment();
                attachment.setEntityType(SdsChemicalMapper.ENTITY_TYPE);
                attachment.setEntityId(entity.getId());
                attachment.setFileName(att.getFileName());
                attachment.setContentType(att.getContentType());
                attachment.setBase64Content(att.getBase64Content());
                attachment.setAttachmentType(guessAttachmentType(att.getContentType()));
                attachment.setContentHash(contentHash);
                attachmentRepo.save(attachment);
            }
        }

        String sharepointId = null;
        String method = "local";

        try {
            SdsChemicalDto spDto = mapper.convertToDto(entity);
            sharepointId = spAdapter.create(spDto);
            if (sharepointId != null) {
                entity.setSharepointId(sharepointId);
                repo.save(entity);
                method = "sharepoint";

                if (dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            spAdapter.addAttachment(sharepointId, att);
                        } catch (Exception e) {
                            log.warn("[PWA SDS] Attachment SP upload failed: {}", e.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[PWA SDS] SP submission failed, saved locally only: {}", e.getMessage());
        }

        publishToPwaSnapshot();
        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    @Transactional
    public PwaSubmissionResult updateSdsChemical(PwaSdsChemicalDto dto) {
        Optional<SdsChemical> existing = Optional.empty();
        if (dto.getLocalUuid() != null) {
            existing = repo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
        }
        if (existing.isEmpty() && dto.getSharepointId() != null) {
            existing = repo.findFirstBySharepointIdOrderByIdAsc(dto.getSharepointId());
        }
        if (existing.isEmpty()) {
            return PwaSubmissionResult.failure("SDS chemical not found", dto.getLocalUuid());
        }

        SdsChemical entity = existing.get();
        if (dto.getNames() != null) entity.setNames(dto.getNames());
        if (dto.getLocations() != null) entity.setLocations(dto.getLocations());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());
        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue(NgSdsChemicalService.STATUS_CATEGORY, dto.getStatusName()));
        }

        repo.save(entity);

        if (entity.getSharepointId() != null) {
            try {
                spAdapter.update(entity.getSharepointId(), mapper.convertToDto(entity));
            } catch (Exception e) {
                log.warn("[PWA SDS] SP update failed: {}", e.getMessage());
            }
        }

        publishToPwaSnapshot();
        return PwaSubmissionResult.success(
                entity.getSharepointId() != null ? "sharepoint" : "local",
                entity.getSharepointId(), dto.getLocalUuid());
    }

    public PwaStatusResult getStatus(String localUuid) {
        Optional<SdsChemical> entity = repo.findFirstByLocalUuidOrderByIdAsc(localUuid);
        if (entity.isEmpty()) return null;

        SdsChemical item = entity.get();
        PwaStatusResult result = new PwaStatusResult();
        result.setLocalUuid(localUuid);
        result.setSharepointId(item.getSharepointId());
        result.setStatus(item.getStatus() != null ? item.getStatus().getName() : NgSdsChemicalService.STATUS_PENDING);
        result.setSubmissionMethod(item.getSharepointId() != null ? "sharepoint" : "local");
        return result;
    }

    private String computeContentHash(String base64Content) {
        if (base64Content == null) return "";
        try {
            // Canonical content hash = SHA-256 of decoded bytes (matches
            // AttachmentSyncHandler + PermitAttachmentSyncService). Prior string-hash broke
            // SP round-trip dedup — duplicate PermitAttachment rows on the poll import.
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(java.util.Base64.getDecoder().decode(base64Content));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private String guessAttachmentType(String contentType) {
        if (contentType == null) return "file";
        if (contentType.startsWith("image/")) return "photo";
        if (contentType.contains("pdf")) return "document";
        return "file";
    }
}
