package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One cell of a {@link com.dk_power.power_plant_java.entities.schedule.CrewPattern}'s role × day
 * rotation grid. Serialized as the JSON array stored in {@code CrewPattern.patternCells}.
 *
 * <ul>
 *   <li>{@code dayIndex} — 0-based position within the rotation cycle (0 .. patternLengthDays-1)</li>
 *   <li>{@code role} — one of {@code CrewPattern.Role}: LEAD | AO | RELIEF</li>
 *   <li>{@code shift} — one of {@code CrewPattern.Shift}: D | N | O | R</li>
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatternCell {
    private Integer dayIndex;
    private String role;
    private String shift;
}
