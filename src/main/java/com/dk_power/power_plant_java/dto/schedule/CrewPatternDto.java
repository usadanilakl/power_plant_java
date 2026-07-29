package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Admin-facing view of a {@link com.dk_power.power_plant_java.entities.schedule.CrewPattern}. The
 * role × day grid is exposed as a parsed {@link PatternCell} list ({@code cells}); the service
 * serializes it to/from the entity's {@code patternCells} JSON column.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrewPatternDto {
    private Long id;
    private String name;
    private String color;
    private Integer patternLengthDays;
    private List<PatternCell> cells;
    private Boolean isActive;
}
