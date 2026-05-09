package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

@Data
public class PwaInventoryUsageDto {
    private String localUuid;
    private String qrToken;
    private Long inventoryItemId;

    private String userName;
    private String userEmail;
    private String location;
    private String purpose;
    private String comments;

    /** "checkout" | "checkin" */
    private String eventType;
    private String scannedAt;

    private String pwaUserUuid;
}
