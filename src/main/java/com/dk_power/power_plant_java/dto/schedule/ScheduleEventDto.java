package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Admin-facing view of a {@link com.dk_power.power_plant_java.entities.schedule.ScheduleEvent}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleEventDto {
    private Long id;
    private String eventType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String title;
    private String description;
    private String color;
    private String appliesToShift;
}
