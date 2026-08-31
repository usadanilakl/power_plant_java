package com.dk_power.power_plant_java.dto.permits;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A place needing air monitoring, with just enough test history to answer the only two questions
 * the list screen asks: when was it last tested, and is it overdue.
 */
@Data
@NoArgsConstructor
public class MonitoredAreaDto {
    private Long id;
    private String name;
    private String sourceType;
    private Long sourcePermitId;
    private String spaceName;
    private Long workAreaId;
    private String workAreaName;
    private Boolean requiresMonitoring;
    private Boolean manuallyRemoved;
    private Integer testIntervalHours;
    private String notes;

    /** Newest test, or null when it has never been tested. */
    private AirTestDto lastTest;

    /**
     * Computed, never stored: {@code lastTest} plus the interval against now.
     *
     * <p>True when there is no test at all — a space nobody has ever tested is the most overdue
     * thing on the list, and reporting it as "fine" because it has no history would be the exact
     * wrong way round.
     */
    private Boolean overdue;
    private Long hoursSinceLastTest;
}
