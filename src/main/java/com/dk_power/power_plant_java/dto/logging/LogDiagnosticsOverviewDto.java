package com.dk_power.power_plant_java.dto.logging;

import java.time.Instant;
import java.util.List;

public record LogDiagnosticsOverviewDto(
    Instant generatedAt,
    int windowMinutes,
    LogDiagnosticsSummaryDto summary,
    List<String> sourceFiles,
    List<LogDiagnosticsIncidentDto> incidents,
    List<LogDiagnosticsFindingDto> findings,
    List<LogDiagnosticsEventDto> recentEvents
) {
}
