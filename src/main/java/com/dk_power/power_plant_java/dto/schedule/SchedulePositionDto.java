package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Admin view of a {@link com.dk_power.power_plant_java.entities.schedule.SchedulePosition}. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchedulePositionDto {
    private Long id;
    private String name;
    private String abbreviation;
    private String color;
    private Integer sortOrder;
    private Boolean isActive;
}
