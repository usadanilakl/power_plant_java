package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

import java.time.Instant;

@Data
public class PwaQualificationDto {
    private String sharepointId;
    private String localUuid;
    private String userId;
    private String userName;
    private String userEmail;
    private String windowsUsername;
    private String role;
    private String qualificationId;
    private String qualificationCode;
    private String qualificationName;
    private String qualificationType;
    private String status;
    private String issuedDate;
    private String expirationDate;
    private String credentialNumber;
    private String issuer;
    private String notes;
    private Instant spModifiedTime;
}
