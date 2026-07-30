package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One cell of a {@link com.dk_power.power_plant_java.entities.schedule.CrewRotation}'s cycle.
 * Serialized as the JSON array stored in {@code CrewRotation.rotationCells}.
 *
 * <ul>
 *   <li>{@code dayIndex} — 0-based position within the cycle (0 .. patternLengthDays-1)</li>
 *   <li>{@code shift} — one of {@code CrewRotation.Shift}: D | N | O</li>
 * </ul>
 * Crew-level (no role dimension): the whole crew shares this shift on the day.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatternCell {
    private Integer dayIndex;
    private String shift;
}
