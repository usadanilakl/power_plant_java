package com.dk_power.power_plant_java.dto.logging;

public record LogDiagnosticsSummaryDto(
    int totalEvents,
    int infoEvents,
    int warnEvents,
    int errorEvents
) {
}
