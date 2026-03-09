package com.dk_power.power_plant_java.dto.instrumentation;

import lombok.Data;

import java.time.Instant;

@Data
public class InstrumentDto {
    private Long id;
    private String tagNumber;
    private String description;
    private String vendor;
    private String location;
    private String type;
    private String currentStatus;
    private String lastUpdatedDate;
    private String lastUpdatedTime;
    private String lastUpdatedBy;
    private String lastComment;
    private String sharepointId;
    private String localUuid;
    private Instant spModifiedTime;
}
