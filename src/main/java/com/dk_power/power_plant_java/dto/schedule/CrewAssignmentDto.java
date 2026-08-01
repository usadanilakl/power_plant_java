package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Admin view of a {@link com.dk_power.power_plant_java.entities.schedule.CrewAssignment} (staffing).
 * {@code userName}/{@code crewName} are read-only display; writes resolve by {@code userId}/{@code crewId}.
 * {@code assignmentType} = ROTATING | FIXED | RELIEF; {@code fixedShift}/{@code fixedDaysOfWeek} apply
 * only to FIXED.
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
    private String position;
    private String groupLabel;      // section heading for FIXED staff (Management / Maintenance / Relief)
    private String assignmentType;
    private String fixedShift;
    private String fixedDaysOfWeek;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
}
