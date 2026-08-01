package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Admin view of a {@link com.dk_power.power_plant_java.entities.schedule.CrewRotation}. The cycle is
 * exposed as a parsed {@link PatternCell} list ({@code cells}); the service serializes it to/from the
 * entity's {@code rotationCells} JSON.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrewRotationDto {
    private Long id;
    private String name;
    private String color;
    private Integer patternLengthDays;
    private LocalDate anchorDate;   // the date that = dayIndex 0 (rotation start); null = epoch-anchored
    private List<PatternCell> cells;
    private Boolean isActive;
}
