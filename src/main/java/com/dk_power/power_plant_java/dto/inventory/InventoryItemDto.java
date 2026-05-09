package com.dk_power.power_plant_java.dto.inventory;

import lombok.Data;

import java.time.Instant;

@Data
public class InventoryItemDto {
    private Long id;
    private String title;
    private String description;
    private String serialNumber;
    private String manufacturer;
    private String model;

    private Long itemTypeId;
    private String itemTypeName;
    private Long statusId;
    private String statusName;
    private Long locationId;
    private String locationName;

    private String qrToken;
    private String currentLocation;
    private String currentHolderName;
    private String currentHolderEmail;
    private Instant lastCheckedOutAt;

    private String sharepointId;
    private String localUuid;
    private Instant spModifiedTime;

    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;

    private String createdBy;
    private String dateCreated;
    private String dateModified;

    private int attachmentCount;
    private int usageCount;
}
