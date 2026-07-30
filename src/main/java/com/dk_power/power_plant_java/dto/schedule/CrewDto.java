package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin view of a {@link com.dk_power.power_plant_java.entities.schedule.Crew}. {@code rotationName}
 * is read-only display; writes resolve the rotation by {@code rotationId}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrewDto {
    private Long id;
    private String name;
    private Long rotationId;
    private String rotationName;
    private Integer offsetDays;
    private String color;
    private Boolean isActive;
}
