package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Admin view of a {@link com.dk_power.power_plant_java.entities.schedule.ReliefRotation}.
 * {@code lineOrder}/{@code initialSlots} are the writable state; {@code lineNames}/{@code current}
 * are read-only display (the current relief person + crew occupants for today).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReliefRotationDto {
    private Long id;
    private String name;
    private String position;
    private Integer periodMonths;
    private LocalDate anchorDate;
    private List<Long> lineOrder;          // succession order (user ids)
    private List<String> lineNames;        // read-only display
    private Map<String, Long> initialSlots; // slot(REL/A/B/C/D) -> user id at anchor
    private String reliefDaysOfWeek;
    private Boolean isActive;

    /** Read-only: resolved slot -> person name for TODAY (who's relief / on each crew now). */
    private Map<String, String> currentToday;
}
