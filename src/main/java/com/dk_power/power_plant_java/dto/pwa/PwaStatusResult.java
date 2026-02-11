package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PwaStatusResult {
    private String localUuid;
    private String sharepointId;
    private String status;              // "pending", "active", "processed", "closed"
    private LocalDateTime processedAt;
    private String processedBy;
    private LocalDateTime submittedAt;
    private String submissionMethod;
}
