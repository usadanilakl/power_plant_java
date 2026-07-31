package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Admin view of an {@link com.dk_power.power_plant_java.entities.schedule.OnCallRotation}.
 * {@code memberUserIds} is the ordered manager list (writes); {@code memberNames} is read-only display.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnCallRotationDto {
    private Long id;
    private String name;
    private Integer daysPerTurn;
    private LocalDate anchorDate;
    private List<Long> memberUserIds;
    private List<String> memberNames;
    private Boolean isActive;
}
