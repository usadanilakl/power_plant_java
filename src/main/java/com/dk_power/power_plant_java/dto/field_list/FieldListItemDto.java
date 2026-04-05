package com.dk_power.power_plant_java.dto.field_list;

import lombok.Data;

import java.time.Instant;

@Data
public class FieldListItemDto {
    private Long id;
    private String title;
    private String notes;
    private String dateObserved;
    private String timeObserved;
    private String specificLocation;

    // Value references (flattened for SP mapping)
    private Long listTypeId;
    private String listTypeName;
    private Long statusId;
    private String statusName;
    private Long locationId;
    private String locationName;

    // Equipment/LotoPoint reference (single tag — resolved server-side to LotoPoint or Equipment)
    private Long equipmentId;
    private String equipmentTag;
    private Long lotoPointId;

    // SP sync
    private String sharepointId;
    private String localUuid;
    private Instant spModifiedTime;

    // Submitter info
    private String submitterName;
    private String submitterEmail;
    private String submitterPhone;

    // Audit
    private String createdBy;
    private String dateCreated;
    private String dateModified;

    // Attachment count (for table display)
    private int attachmentCount;
}
