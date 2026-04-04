package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaFieldListItemDto;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.field_list.FieldListItemMapper;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.FieldListItemSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaFieldListItemService {

    private final FieldListItemSharePointAdapter spAdapter;
    private final FieldListItemRepo repo;
    private final FieldListItemMapper mapper;
    private final PermitAttachmentRepo attachmentRepo;
    private final NgValueService valueService;

    @Transactional
    public PwaSubmissionResult submitFieldListItem(PwaFieldListItemDto dto) {
        // Check for duplicate by localUuid
        Optional<FieldListItem> existing = repo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
        if (existing.isPresent()) {
            log.info("[PWA FieldList] Duplicate detected for localUuid={}", dto.getLocalUuid());
            return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
        }

        // Convert to entity
        FieldListItem entity = new FieldListItem();
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setTitle(dto.getTitle());
        entity.setNotes(dto.getNotes());
        entity.setDateObserved(dto.getDateObserved());
        entity.setTimeObserved(dto.getTimeObserved());
        entity.setSpecificLocation(dto.getSpecificLocation());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());

        // Resolve Value references
        if (dto.getListTypeName() != null) {
            entity.setListType(valueService.createValue("FieldListType", dto.getListTypeName()));
        }
        entity.setStatus(valueService.createValue("FieldListStatus",
                dto.getStatusName() != null ? dto.getStatusName() : "Open"));
        if (dto.getLocationName() != null) {
            entity.setLocation(valueService.createValue("Location", dto.getLocationName()));
        }

        // Resolve equipment/lotoPoint
        mapper.resolveEquipmentReference(entity, dto.getEquipmentTag(), null);

        // Timestamp
        String timeSubmitted = ZonedDateTime.now(ZoneId.of("America/Chicago"))
                .format(DateTimeFormatter.ofPattern("MM/dd/yyyy hh:mm a"));
        dto.setTimeSubmitted(timeSubmitted);

        // Save locally first
        entity = repo.saveAndFlush(entity);
        log.info("[PWA FieldList] Saved locally: id={}, localUuid={}", entity.getId(), dto.getLocalUuid());

        // Save attachments with dedup
        if (dto.getAttachments() != null) {
            int saved = 0;
            for (PaAttachmentDto att : dto.getAttachments()) {
                String contentHash = computeContentHash(att.getBase64Content());
                if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                        "FieldListItem", entity.getId(), att.getFileName(), contentHash)) {
                    continue;
                }
                PermitAttachment attachment = new PermitAttachment();
                attachment.setEntityType("FieldListItem");
                attachment.setEntityId(entity.getId());
                attachment.setFileName(att.getFileName());
                attachment.setContentType(att.getContentType());
                attachment.setBase64Content(att.getBase64Content());
                attachment.setAttachmentType(guessAttachmentType(att.getContentType()));
                attachment.setContentHash(contentHash);
                attachmentRepo.save(attachment);
                saved++;
            }
            log.info("[PWA FieldList] Saved {} attachments for localUuid={}", saved, dto.getLocalUuid());
        }

        // Attempt SharePoint submission
        String sharepointId = null;
        String method = "local";

        try {
            FieldListItemDto spDto = mapper.convertToDto(entity);
            sharepointId = spAdapter.create(spDto);
            if (sharepointId != null) {
                entity.setSharepointId(sharepointId);
                repo.save(entity);
                method = "sharepoint";
                log.info("[PWA FieldList] Created in SP: spId={}, localUuid={}", sharepointId, dto.getLocalUuid());

                // Upload attachments to SP
                if (dto.getAttachments() != null) {
                    for (PaAttachmentDto att : dto.getAttachments()) {
                        try {
                            spAdapter.addAttachment(sharepointId, att);
                        } catch (Exception e) {
                            log.warn("[PWA FieldList] Failed to upload attachment '{}' to SP: {}",
                                    att.getFileName(), e.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[PWA FieldList] SP submission failed, saved locally only: {}", e.getMessage());
        }

        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    public PwaStatusResult getStatus(String localUuid) {
        Optional<FieldListItem> entity = repo.findFirstByLocalUuidOrderByIdAsc(localUuid);
        if (entity.isEmpty()) return null;

        FieldListItem item = entity.get();
        PwaStatusResult result = new PwaStatusResult();
        result.setLocalUuid(localUuid);
        result.setSharepointId(item.getSharepointId());
        result.setStatus(item.getStatus() != null ? item.getStatus().getName() : "Open");
        result.setSubmissionMethod(item.getSharepointId() != null ? "sharepoint" : "local");
        return result;
    }

    @Transactional
    public PwaSubmissionResult updateFieldListItem(PwaFieldListItemDto dto) {
        Optional<FieldListItem> existing = Optional.empty();
        if (dto.getLocalUuid() != null) {
            existing = repo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
        }
        if (existing.isEmpty() && dto.getSharepointId() != null) {
            existing = repo.findFirstBySharepointIdOrderByIdAsc(dto.getSharepointId());
        }
        if (existing.isEmpty()) {
            return PwaSubmissionResult.failure("Field list item not found", dto.getLocalUuid());
        }

        FieldListItem entity = existing.get();
        if (dto.getTitle() != null) entity.setTitle(dto.getTitle());
        if (dto.getNotes() != null) entity.setNotes(dto.getNotes());
        if (dto.getDateObserved() != null) entity.setDateObserved(dto.getDateObserved());
        if (dto.getTimeObserved() != null) entity.setTimeObserved(dto.getTimeObserved());
        if (dto.getSpecificLocation() != null) entity.setSpecificLocation(dto.getSpecificLocation());
        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("FieldListStatus", dto.getStatusName()));
        }
        if (dto.getLocationName() != null) {
            entity.setLocation(valueService.createValue("Location", dto.getLocationName()));
        }
        if (dto.getEquipmentTag() != null) {
            mapper.resolveEquipmentReference(entity, dto.getEquipmentTag(), null);
        }

        repo.save(entity);

        // Push update to SP if connected
        if (entity.getSharepointId() != null) {
            try {
                FieldListItemDto spDto = mapper.convertToDto(entity);
                spAdapter.update(entity.getSharepointId(), spDto);
            } catch (Exception e) {
                log.warn("[PWA FieldList] Failed to update SP: {}", e.getMessage());
            }
        }

        return PwaSubmissionResult.success(
                entity.getSharepointId() != null ? "sharepoint" : "local",
                entity.getSharepointId(), dto.getLocalUuid());
    }

    private String computeContentHash(String base64Content) {
        if (base64Content == null) return "";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(base64Content.getBytes(StandardCharsets.UTF_8));
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
