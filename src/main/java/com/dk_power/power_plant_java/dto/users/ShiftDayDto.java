package com.dk_power.power_plant_java.dto.users;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftDayDto {
    private Long id;
    private LocalDate date;
    private Integer year;
    private List<ShiftEntry> dayShift;
    private List<ShiftEntry> nightShift;
    private List<ShiftEntry> unscheduled;
    private List<ShiftEntry> pto;
    private List<ShiftEntry> training;
    private String onCallManagerName;
    private Long onCallManagerUserId;
    private String source;
    private LocalDateTime lastSyncedAt;
}
