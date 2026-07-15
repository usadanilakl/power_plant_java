package com.dk_power.power_plant_java.sevice.angular.inventory;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.inventory.InventoryItemDto;
import com.dk_power.power_plant_java.dto.inventory.InventoryUsageDto;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.entities.inventory.InventoryItem;
import com.dk_power.power_plant_java.entities.inventory.InventoryUsage;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.inventory.InventoryItemMapper;
import com.dk_power.power_plant_java.mappers.inventory.InventoryUsageMapper;
import com.dk_power.power_plant_java.repository.inventory.InventoryItemRepo;
import com.dk_power.power_plant_java.repository.inventory.InventoryUsageRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InventoryItemSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.InventoryUsageSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NgInventoryItemService {

    private final InventoryItemRepo repo;
    private final InventoryUsageRepo usageRepo;
    private final InventoryItemMapper mapper;
    private final InventoryUsageMapper usageMapper;
    private final NgValueService valueService;
    private final PermitAttachmentRepo attachmentRepo;
    private final InventoryItemSharePointAdapter spAdapter;
    private final InventoryUsageSharePointAdapter usageSpAdapter;
    private final SyncConfig syncConfig;

    private static final List<String> ACTIVE_STATUSES = List.of("Available", "Checked Out");

    public List<InventoryItemDto> getAll() {
        return mapper.convertToDtos(repo.findAll());
    }

    public List<InventoryItemDto> getByItemType(String itemTypeName) {
        return mapper.convertToDtos(repo.findByItemType_NameIgnoreCase(itemTypeName));
    }

    public List<InventoryItemDto> getByStatus(String statusName) {
        return mapper.convertToDtos(repo.findByStatus_NameIgnoreCase(statusName));
    }

    public List<InventoryItemDto> getActiveItems() {
        return mapper.convertToDtos(repo.findByStatus_NameIn(ACTIVE_STATUSES));
    }

    /** Items currently checked out, optionally filter by minimum days out. */
    public List<InventoryItemDto> getCheckedOutItems(Integer minDaysOut) {
        List<InventoryItem> items = repo.findByStatus_NameIgnoreCase("Checked Out");
        if (minDaysOut != null && minDaysOut > 0) {
            Instant cutoff = Instant.now().minusSeconds(minDaysOut * 86400L);
            items = items.stream()
                    .filter(i -> i.getLastCheckedOutAt() != null && i.getLastCheckedOutAt().isBefore(cutoff))
                    .toList();
        }
        return mapper.convertToDtos(items);
    }

    /** Items reported missing. */
    public List<InventoryItemDto> getMissingItems() {
        return mapper.convertToDtos(repo.findByStatus_NameIgnoreCase("Missing"));
    }

    public List<InventoryItemDto> getActiveItemsByType(String itemTypeName) {
        return mapper.convertToDtos(
            repo.findByItemType_NameIgnoreCaseAndStatus_NameIn(itemTypeName, ACTIVE_STATUSES));
    }

    public InventoryItemDto getDtoById(Long id) {
        return repo.findById(id).map(mapper::convertToDto).orElse(null);
    }

    public InventoryItemDto getDtoByQrToken(String qrToken) {
        return repo.findFirstByQrTokenOrderByIdAsc(qrToken).map(mapper::convertToDto).orElse(null);
    }

    public InventoryItem getEntity() {
        return new InventoryItem();
    }

    public InventoryItemDto save(InventoryItemDto dto) {
        InventoryItem entity;
        if (dto.getId() != null) {
            entity = repo.findById(dto.getId()).orElse(new InventoryItem());
        } else {
            entity = new InventoryItem();
        }

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
        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("InventoryStatus", dto.getStatusName()));
        } else if (entity.getStatus() == null) {
            entity.setStatus(valueService.createValue("InventoryStatus", "Available"));
        }
        if (dto.getLocationName() != null) {
            entity.setLocation(valueService.createValue("Location", dto.getLocationName()));
        }

        // QR token is generated server-side on first save and never changes
        if (entity.getQrToken() == null || entity.getQrToken().isBlank()) {
            entity.setQrToken(generateUniqueQrToken());
        }

        entity = repo.save(entity);
        return mapper.convertToDto(entity);
    }

    public InventoryItemDto changeStatus(Long id, String statusName) {
        InventoryItem entity = repo.findById(id).orElseThrow(() ->
                new RuntimeException("InventoryItem not found: " + id));
        entity.setStatus(valueService.createValue("InventoryStatus", statusName));
        entity = repo.save(entity);

        if (entity.getSharepointId() != null) {
            try {
                spAdapter.changeStatus(entity.getSharepointId(), statusName);
            } catch (Exception e) {
                log.warn("[Inventory] SP status change failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
            }
        }
        return mapper.convertToDto(entity);
    }

    // ============ Usage log ============

    public List<InventoryUsageDto> getUsageHistory(Long inventoryItemId) {
        return usageRepo.findByInventoryItem_IdOrderByScannedAtDesc(inventoryItemId).stream()
                .map(usageMapper::convertToDto).toList();
    }

    public InventoryUsageDto recordUsage(Long inventoryItemId, String userName, String userEmail,
                                         String location, String purpose, String comments, String eventType) {
        InventoryItem item = repo.findById(inventoryItemId).orElseThrow(() ->
                new RuntimeException("InventoryItem not found: " + inventoryItemId));

        InventoryUsage usage = new InventoryUsage();
        usage.setInventoryItem(item);
        usage.setUserName(userName);
        usage.setUserEmail(userEmail);
        usage.setLocation(location);
        usage.setPurpose(purpose);
        usage.setComments(comments);
        usage.setEventType(eventType != null ? eventType : "checkout");
        usage.setScannedAt(Instant.now());
        usage.setLocalUuid(java.util.UUID.randomUUID().toString());
        usage = usageRepo.save(usage);

        // Update item status + holder based on event
        if ("checkout".equalsIgnoreCase(eventType)) {
            item.setStatus(valueService.createValue("InventoryStatus", "Checked Out"));
            item.setCurrentHolderName(userName);
            item.setCurrentHolderEmail(userEmail);
            item.setCurrentLocation(location);
            item.setLastCheckedOutAt(usage.getScannedAt());
        } else if ("checkin".equalsIgnoreCase(eventType)) {
            item.setStatus(valueService.createValue("InventoryStatus", "Available"));
            item.setCurrentHolderName(null);
            item.setCurrentHolderEmail(null);
            item.setCurrentLocation(location);
        }
        repo.save(item);

        // Best-effort push to SharePoint Inventory Usage list
        try {
            InventoryUsageDto spDto = usageMapper.convertToDto(usage);
            spDto.setInventoryItemQrToken(item.getQrToken());
            String spId = usageSpAdapter.create(spDto);
            if (spId != null) {
                usage.setSharepointId(spId);
                usageRepo.save(usage);
            }
        } catch (Exception e) {
            log.warn("[Inventory] SP usage push failed: {}", e.getMessage());
        }

        return usageMapper.convertToDto(usage);
    }

    // ============ Attachments ============

    public PermitAttachment uploadAttachment(Long entityId, String fileName, String contentType, String base64Content) {
        String hash = computeContentHash(base64Content);

        PermitAttachment att = new PermitAttachment();
        att.setEntityType("InventoryItem");
        att.setEntityId(entityId);
        att.setFileName(fileName);
        att.setContentType(contentType);
        att.setAttachmentType(contentType != null && contentType.startsWith("image/") ? "photo" : "document");
        att.setBase64Content(base64Content);
        att.setContentHash(hash);
        att.setOriginMachineId(syncConfig.getMachineId());
        att.setSyncedToServer(false);
        att = attachmentRepo.save(att);

        InventoryItem entity = repo.findById(entityId).orElse(null);
        if (entity != null && entity.getSharepointId() != null) {
            try {
                PaAttachmentDto paAtt = new PaAttachmentDto();
                paAtt.setFileName(fileName);
                paAtt.setContentType(contentType);
                paAtt.setBase64Content(base64Content);
                spAdapter.addAttachment(entity.getSharepointId(), paAtt);
            } catch (Exception e) {
                log.warn("[Inventory] SP attachment upload failed: {}", e.getMessage());
            }
        }
        return att;
    }

    public void deleteAttachment(Long entityId, Long attachmentId) {
        attachmentRepo.deleteById(attachmentId);
    }

    public void softDelete(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
            // Push hard-delete to SharePoint so the row disappears from the
            // Inventory list. Best-effort: local + hub soft-delete already
            // happened above via repo.save; SP failure must not undo that.
            if (entity.getSharepointId() != null && !entity.getSharepointId().isBlank()) {
                try {
                    spAdapter.delete(entity.getSharepointId());
                } catch (Exception e) {
                    log.warn("[Inventory] SP delete failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
                }
            }
        });
    }

    // ============ Helpers ============

    private String generateUniqueQrToken() {
        for (int i = 0; i < 10; i++) {
            String token = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            if (!repo.existsByQrToken(token)) return token;
        }
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String computeContentHash(String base64Content) {
        if (base64Content == null || base64Content.isEmpty()) return null;
        try {
            byte[] bytes = Base64.getDecoder().decode(base64Content);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
