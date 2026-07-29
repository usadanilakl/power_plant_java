package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Admin-facing view of a {@link com.dk_power.power_plant_java.entities.schedule.CrewAssignment}.
 * {@code userName}/{@code crewName} are read-only display fields; writes resolve by
 * {@code userId}/{@code crewId}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrewAssignmentDto {
    private Long id;
    private Long userId;
    private String userName;
    private Long crewId;
    private String crewName;
    private String role;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer patternOffsetDays;
    private Boolean isActive;
}
