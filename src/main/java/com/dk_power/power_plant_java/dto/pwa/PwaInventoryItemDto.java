package com.dk_power.power_plant_java.dto.pwa;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import lombok.Data;

import java.util.List;

@Data
public class PwaInventoryItemDto {
    private String localUuid;
    private String sharepointId;

    private String itemTypeName;
    private String statusName;

    private String title;
    private String description;
    private String serialNumber;
    private String manufacturer;
    private String model;

    private String locationName;
    private String currentLocation;

    private String qrToken;

    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;
    private String pwaUserUuid;
    private String timeSubmitted;

    private List<PaAttachmentDto> attachments;
}
