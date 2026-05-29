package com.dk_power.power_plant_java.dto.sds;

import lombok.Data;

import java.time.Instant;

@Data
public class SdsAuditRecordDto {
    private Long id;

    private String chemicalSharepointId;
    private String chemicalLocalUuid;
    private String chemicalName;

    private String action;
    private String oldSnapshot;

    private String auditedByName;
    private String auditedByEmail;
    private Instant auditedAt;

    private String comments;
    private String campaign;

    private String sharepointId;
    private String localUuid;
    private Instant spModifiedTime;

    private String createdBy;
    private String dateCreated;
    private String dateModified;
}
