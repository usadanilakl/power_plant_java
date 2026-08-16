package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import lombok.Data;

import java.util.List;

@Data
public class PwaFieldListItemDto {
    private String localUuid;
    private String sharepointId;

    // List type and status
    private String listTypeName;
    private String statusName;

    // Core fields
    private String title;
    private String notes;
    private String dateObserved;
    private String timeObserved;

    // Location
    private String locationName;
    private String specificLocation;

    // Equipment reference (single search field — resolved to LotoPoint or Equipment on backend)
    private String equipmentTag;

    // Submitter info
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String pwaUserUuid;
    private String timeSubmitted;

    // Attachments
    private List<PaAttachmentDto> attachments;

    // Optional Maximo picker fields — sent when the PWA form's Maximo tree picker was used.
    // Bridge sends them on WO/SR create as spi:location and spi:assetnum. Null = ops assigns.
    private String maximoLocation;
    private String maximoAssetnum;
}
