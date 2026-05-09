package com.dk_power.power_plant_java.mappers.inventory;

import com.dk_power.power_plant_java.dto.inventory.InventoryItemDto;
import com.dk_power.power_plant_java.entities.inventory.InventoryItem;
import com.dk_power.power_plant_java.repository.inventory.InventoryUsageRepo;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class InventoryItemMapper {

    private final NgValueService valueService;
    private final PermitAttachmentRepo attachmentRepo;
    private final InventoryUsageRepo usageRepo;

    public InventoryItemDto convertToDto(InventoryItem entity) {
        if (entity == null) return null;
        InventoryItemDto dto = convertToDtoBase(entity);
        if (entity.getId() != null) {
            dto.setAttachmentCount(
                (int) attachmentRepo.countByEntityTypeAndEntityId("InventoryItem", entity.getId()));
            dto.setUsageCount(
                usageRepo.findByInventoryItem_IdOrderByScannedAtDesc(entity.getId()).size());
        }
        return dto;
    }

    /** Batch-optimized: 1 query for attachment counts instead of N. */
    public List<InventoryItemDto> convertToDtos(List<InventoryItem> entities) {
        if (entities == null || entities.isEmpty()) return List.of();

        List<Long> ids = entities.stream().map(InventoryItem::getId).toList();
        Map<Long, Integer> attachmentCounts = new HashMap<>();
        attachmentRepo.countByEntityTypeGroupedByEntityId("InventoryItem", ids)
            .forEach(row -> attachmentCounts.put((Long) row[0], ((Number) row[1]).intValue()));

        return entities.stream().map(entity -> {
            InventoryItemDto dto = convertToDtoBase(entity);
            dto.setAttachmentCount(attachmentCounts.getOrDefault(entity.getId(), 0));
            return dto;
        }).toList();
    }

    private InventoryItemDto convertToDtoBase(InventoryItem entity) {
        InventoryItemDto dto = new InventoryItemDto();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setSerialNumber(entity.getSerialNumber());
        dto.setManufacturer(entity.getManufacturer());
        dto.setModel(entity.getModel());
        dto.setQrToken(entity.getQrToken());
        dto.setCurrentLocation(entity.getCurrentLocation());
        dto.setCurrentHolderName(entity.getCurrentHolderName());
        dto.setCurrentHolderEmail(entity.getCurrentHolderEmail());
        dto.setLastCheckedOutAt(entity.getLastCheckedOutAt());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setSpModifiedTime(entity.getSpModifiedTime());
        dto.setSubmitterName(entity.getSubmitterName());
        dto.setSubmitterEmail(entity.getSubmitterEmail());
        dto.setSubmitterPhone(entity.getSubmitterPhone());
        dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated().toString());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified().toString());

        if (entity.getItemType() != null) {
            dto.setItemTypeId(entity.getItemType().getId());
            dto.setItemTypeName(entity.getItemType().getName());
        }
        if (entity.getStatus() != null) {
            dto.setStatusId(entity.getStatus().getId());
            dto.setStatusName(entity.getStatus().getName());
        }
        if (entity.getLocation() != null) {
            dto.setLocationId(entity.getLocation().getId());
            dto.setLocationName(entity.getLocation().getName());
        }
        return dto;
    }

    public InventoryItem convertToEntity(InventoryItemDto dto) {
        if (dto == null) return null;
        InventoryItem entity = new InventoryItem();
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setSerialNumber(dto.getSerialNumber());
        entity.setManufacturer(dto.getManufacturer());
        entity.setModel(dto.getModel());
        entity.setQrToken(dto.getQrToken());
        entity.setCurrentLocation(dto.getCurrentLocation());
        entity.setCurrentHolderName(dto.getCurrentHolderName());
        entity.setCurrentHolderEmail(dto.getCurrentHolderEmail());
        entity.setLastCheckedOutAt(dto.getLastCheckedOutAt());
        entity.setSharepointId(dto.getSharepointId());
        entity.setLocalUuid(dto.getLocalUuid());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());

        if (dto.getItemTypeName() != null) {
            entity.setItemType(valueService.createValue("InventoryType", dto.getItemTypeName()));
        }
        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("InventoryStatus", dto.getStatusName()));
        }
        if (dto.getLocationName() != null) {
            entity.setLocation(valueService.createValue("Location", dto.getLocationName()));
        }
        return entity;
    }
}
