package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Admin-facing view of a {@link com.dk_power.power_plant_java.entities.schedule.CrewShiftOverride}
 * — a temporary per-crew shift pin for an outage window.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrewShiftOverrideDto {
    private Long id;
    private String label;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long crewId;
    private String crewName;
    /** D | N | OFF */
    private String shift;
    private Boolean isActive;
}
