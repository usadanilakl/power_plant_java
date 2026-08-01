package com.dk_power.power_plant_java.dto.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Admin/operator view of a {@link com.dk_power.power_plant_java.entities.schedule.CoverageRequest}.
 * {@code approvedCount} is the total approved signups across the range (informational for the
 * manager list); {@code date}/{@code openForDate} are populated only by the per-day operator query
 * to express "seats still open on THIS day".
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoverageRequestDto {
    private Long id;
    private LocalDate startDate;
    private LocalDate endDate;
    private String shift;          // DAY | NIGHT
    private String discipline;     // OPS | MECHANIC | IC | MANAGER
    private String position;       // LEAD | CRO | AO (OPS only)
    private Integer requiredCount;
    private String reason;         // OUTAGE | PTO_COVERAGE | MANUAL
    private String status;         // OPEN | FULFILLED | CANCELLED
    private Integer approvedCount;
    private Long ptoRequestId;

    /** Populated only by the per-day operator query. */
    private LocalDate date;
    private Integer openForDate;
}
