package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.inventory.InventoryItemDto;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInventoryItemDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInventoryUsageDto;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.inventory.InventoryItem;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.inventory.InventoryItemMapper;
import com.dk_power.power_plant_java.repository.inventory.InventoryItemRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.inventory.NgInventoryItemService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InventoryItemSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaInventoryItemService {

    private final InventoryItemSharePointAdapter spAdapter;
    private final InventoryItemRepo repo;
    private final InventoryItemMapper mapper;
    private final PermitAttachmentRepo attachmentRepo;
    private final NgValueService valueService;
    private final NgInventoryItemService ngService;

    @Transactional
    public PwaSubmissionResult submitInventoryItem(PwaInventoryItemDto dto) {
        Optional<InventoryItem> existing = repo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
        if (existing.isPresent()) {
            log.info("[PWA Inventory] Duplicate detected for localUuid={}", dto.getLocalUuid());
            return PwaSubmissionResult.duplicate(existing.get().getSharepointId(), dto.getLocalUuid());
        }

        InventoryItem entity = new InventoryItem();
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setSerialNumber(dto.getSerialNumber());
        entity.setManufacturer(dto.getManufacturer());
        entity.setModel(dto.getModel());
        entity.setCurrentLocation(dto.getCurrentLocation());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());

        if (dto.getItemTypeName() != null) {
            entity.setItemType(valueService.createValue("InventoryType", dto.getItemTypeName()));
        }
        entity.setStatus(valueService.createValue("InventoryStatus",
                dto.getStatusName() != null ? dto.getStatusName() : "Available"));
        mapper.resolveLocation(entity, dto.getLocationName());

        // Generate QR token if not provided
        if (entity.getQrToken() == null || entity.getQrToken().isBlank()) {
            entity.setQrToken(generateUniqueQrToken());
        }

        entity = repo.saveAndFlush(entity);
        log.info("[PWA Inventory] Saved locally: id={}, qrToken={}, localUuid={}",
                entity.getId(), entity.getQrToken(), dto.getLocalUuid());

        // Save attachments with dedup
        if (dto.getAttachments() != null) {
            for (PaAttachmentDto att : dto.getAttachments()) {
                String contentHash = computeContentHash(att.getBase64Content());
                if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                        "InventoryItem", entity.getId(), att.getFileName(), contentHash)) {
                    continue;
                }
                PermitAttachment attachment = new PermitAttachment();
                attachment.setEntityType("InventoryItem");
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
            InventoryItemDto spDto = mapper.convertToDto(entity);
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
                            log.warn("[PWA Inventory] Attachment SP upload failed: {}", e.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[PWA Inventory] SP submission failed, saved locally only: {}", e.getMessage());
        }

        return PwaSubmissionResult.success(method, sharepointId, dto.getLocalUuid());
    }

    @Transactional
    public PwaSubmissionResult updateInventoryItem(PwaInventoryItemDto dto) {
        Optional<InventoryItem> existing = Optional.empty();
        if (dto.getLocalUuid() != null) {
            existing = repo.findFirstByLocalUuidOrderByIdAsc(dto.getLocalUuid());
        }
        if (existing.isEmpty() && dto.getSharepointId() != null) {
            existing = repo.findFirstBySharepointIdOrderByIdAsc(dto.getSharepointId());
        }
        if (existing.isEmpty()) {
            return PwaSubmissionResult.failure("Inventory item not found", dto.getLocalUuid());
        }

        InventoryItem entity = existing.get();
        if (dto.getTitle() != null) entity.setTitle(dto.getTitle());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getSerialNumber() != null) entity.setSerialNumber(dto.getSerialNumber());
        if (dto.getManufacturer() != null) entity.setManufacturer(dto.getManufacturer());
        if (dto.getModel() != null) entity.setModel(dto.getModel());
        if (dto.getCurrentLocation() != null) entity.setCurrentLocation(dto.getCurrentLocation());
        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("InventoryStatus", dto.getStatusName()));
        }
        mapper.resolveLocation(entity, dto.getLocationName());

        repo.save(entity);

        if (entity.getSharepointId() != null) {
            try {
                spAdapter.update(entity.getSharepointId(), mapper.convertToDto(entity));
            } catch (Exception e) {
                log.warn("[PWA Inventory] SP update failed: {}", e.getMessage());
            }
        }

        return PwaSubmissionResult.success(
                entity.getSharepointId() != null ? "sharepoint" : "local",
                entity.getSharepointId(), dto.getLocalUuid());
    }

    public PwaStatusResult getStatus(String localUuid) {
        Optional<InventoryItem> entity = repo.findFirstByLocalUuidOrderByIdAsc(localUuid);
        if (entity.isEmpty()) return null;

        InventoryItem item = entity.get();
        PwaStatusResult result = new PwaStatusResult();
        result.setLocalUuid(localUuid);
        result.setSharepointId(item.getSharepointId());
        result.setStatus(item.getStatus() != null ? item.getStatus().getName() : "Available");
        result.setSubmissionMethod(item.getSharepointId() != null ? "sharepoint" : "local");
        return result;
    }

    /** PWA scan: lookup by QR token and record usage. */
    @Transactional
    public PwaSubmissionResult recordUsage(PwaInventoryUsageDto dto) {
        Optional<InventoryItem> itemOpt = Optional.empty();
        if (dto.getQrToken() != null && !dto.getQrToken().isBlank()) {
            itemOpt = repo.findFirstByQrTokenOrderByIdAsc(dto.getQrToken());
        }
        if (itemOpt.isEmpty() && dto.getInventoryItemId() != null) {
            itemOpt = repo.findById(dto.getInventoryItemId());
        }
        if (itemOpt.isEmpty()) {
            return PwaSubmissionResult.failure("Inventory item not found", dto.getLocalUuid());
        }

        ngService.recordUsage(itemOpt.get().getId(), dto.getUserName(), dto.getUserEmail(),
                dto.getLocation(), dto.getPurpose(), dto.getComments(), dto.getEventType());

        return PwaSubmissionResult.success("local", itemOpt.get().getSharepointId(), dto.getLocalUuid());
    }

    private String generateUniqueQrToken() {
        for (int i = 0; i < 10; i++) {
            String token = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            if (!repo.existsByQrToken(token)) return token;
        }
        return UUID.randomUUID().toString().replace("-", "");
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
