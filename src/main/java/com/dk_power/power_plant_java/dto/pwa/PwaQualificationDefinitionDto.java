package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

import java.time.Instant;

@Data
public class PwaQualificationDefinitionDto {
    private String sharepointId;
    private String localUuid;
    private String qualificationCode;
    private String qualificationName;
    private String qualificationType;
    private String description;
    private Boolean requiresExpiration = false;
    private String defaultValidityMonths;
    private Boolean active = true;
    private String sortOrder;
    private String notes;
    private Instant spModifiedTime;
}
