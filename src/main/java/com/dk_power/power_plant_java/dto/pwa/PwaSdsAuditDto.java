package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

@Data
public class PwaSdsAuditDto {
    private String localUuid;
    private String sharepointId;

    private String chemicalSharepointId;
    private String chemicalLocalUuid;
    private String chemicalName;

    private String action;       // "Confirmed" | "Edited"
    private String oldSnapshot;  // JSON of pre-edit values (built client-side; empty for Confirmed)

    private String auditedByName;
    private String auditedByEmail;
    private String comments;
    private String campaign;

    private String timeSubmitted;
}
