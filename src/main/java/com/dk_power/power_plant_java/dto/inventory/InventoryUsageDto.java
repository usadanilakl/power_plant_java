package com.dk_power.power_plant_java.dto.inventory;

import lombok.Data;

import java.time.Instant;

@Data
public class InventoryUsageDto {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemTitle;
    private String inventoryItemQrToken;

    private String userName;
    private String userEmail;
    private String location;
    private String purpose;
    private String comments;

    private Instant scannedAt;
    private Instant returnedAt;
    private String eventType;

    private String sharepointId;
    private String localUuid;
    private Instant spModifiedTime;

    private String createdBy;
    private String dateCreated;
    private String dateModified;
}
