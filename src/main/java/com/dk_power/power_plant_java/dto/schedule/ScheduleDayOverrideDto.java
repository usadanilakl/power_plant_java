package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Admin-facing view of a {@link com.dk_power.power_plant_java.entities.schedule.ScheduleDayOverride} —
 * a per-day, per-person manual adjustment applied last by the materialiser (wins over pattern output).
 * {@code shift} is one of {@code ScheduleDayOverride.Code}: D | N | OCM | P | T | L | OFF.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleDayOverrideDto {
    private Long id;
    private LocalDate date;
    private Long userId;
    private String userName;
    private String shift;
    private String reason;
}
