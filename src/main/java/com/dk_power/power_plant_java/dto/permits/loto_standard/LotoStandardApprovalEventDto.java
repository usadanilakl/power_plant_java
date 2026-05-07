package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.entities.loto.LotoStandardApprovalEvent;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class LotoStandardApprovalEventDto {
    private Long id;
    private Long standardId;
    private Integer standardVersion;
    private String eventType;
    private String performedBy;
    private LocalDateTime eventAt;
    private String fromStatus;
    private String toStatus;
    private String notes;

    public static LotoStandardApprovalEventDto from(LotoStandardApprovalEvent e) {
        if (e == null) return null;
        LotoStandardApprovalEventDto dto = new LotoStandardApprovalEventDto();
        dto.id = e.getId();
        dto.standardId = e.getStandard() != null ? e.getStandard().getId() : null;
        dto.standardVersion = e.getStandardVersion();
        dto.eventType = e.getEventType() != null ? e.getEventType().name() : null;
        dto.performedBy = e.getPerformedBy();
        dto.eventAt = e.getEventAt();
        dto.fromStatus = e.getFromStatus();
        dto.toStatus = e.getToStatus();
        dto.notes = e.getNotes();
        return dto;
    }
}
