package com.dk_power.power_plant_java.mappers.inventory;

import com.dk_power.power_plant_java.dto.inventory.InventoryUsageDto;
import com.dk_power.power_plant_java.entities.inventory.InventoryUsage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InventoryUsageMapper {

    public InventoryUsageDto convertToDto(InventoryUsage entity) {
        if (entity == null) return null;
        InventoryUsageDto dto = new InventoryUsageDto();
        dto.setId(entity.getId());
        dto.setUserName(entity.getUserName());
        dto.setUserEmail(entity.getUserEmail());
        dto.setLocation(entity.getLocation());
        dto.setPurpose(entity.getPurpose());
        dto.setComments(entity.getComments());
        dto.setScannedAt(entity.getScannedAt());
        dto.setReturnedAt(entity.getReturnedAt());
        dto.setEventType(entity.getEventType());
        dto.setSharepointId(entity.getSharepointId());
        dto.setLocalUuid(entity.getLocalUuid());
        dto.setSpModifiedTime(entity.getSpModifiedTime());
        dto.setCreatedBy(entity.getCreatedBy());
        if (entity.getDateCreated() != null) dto.setDateCreated(entity.getDateCreated().toString());
        if (entity.getDateModified() != null) dto.setDateModified(entity.getDateModified().toString());
        if (entity.getInventoryItem() != null) {
            dto.setInventoryItemId(entity.getInventoryItem().getId());
            dto.setInventoryItemTitle(entity.getInventoryItem().getTitle());
            dto.setInventoryItemQrToken(entity.getInventoryItem().getQrToken());
        }
        return dto;
    }
}
