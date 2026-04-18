package com.dk_power.power_plant_java.entities.etapro.report;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Runtime parameters for a report execution — serialized to
 * {@code EtaProReportExecution.paramsJson}.
 */
@Getter
@Setter
@NoArgsConstructor
public class ReportParams {
    /** Maximum number of event instances to find. */
    private int maxInstances = 20;

    /** Search direction: true = most recent first. */
    private boolean searchBackwards = true;

    /** Optional: limit search to readings after this time. */
    private LocalDateTime searchFrom;

    /** Optional: limit search to readings before this time. */
    private LocalDateTime searchTo;

    /** Seconds of context to include before the trigger for chart slices. */
    private int contextBeforeSeconds = 300;  // 5 min

    /** Seconds of context to include after event end for chart slices. */
    private int contextAfterSeconds = 300;
}
