package com.dk_power.power_plant_java.dto.maximo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * One row of the PM audit list: a recurring PM plus the cheap, hub-local facts we can show without hitting
 * Maximo (cadence, last known target date, whether it's overdue by schedule). The actual completion history —
 * last completed/closed WO, its form + comment, and the next scheduled WO — is loaded per PM on expand from the
 * live occurrences (see the occurrence + {@code completion-detail} endpoints), the same way the Recurring PMs
 * tab's clock-icon history works.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PmAuditRowDto {
    private Long pmId;
    private String pmnum;
    private String description;
    private String cadence;
    private boolean recurring;
    private LocalDate targetDate;        // last known target-start (from the catalog)
    private String lastWonum;            // last occurrence's WO (any status) — a quick hint
    private Integer occurrenceCount;
    private boolean overdue;             // next-due (last target + interval) is in the past
}
