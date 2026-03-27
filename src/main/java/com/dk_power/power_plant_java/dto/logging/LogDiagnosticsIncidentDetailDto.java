package com.dk_power.power_plant_java.dto.logging;

import java.util.List;

public record LogDiagnosticsIncidentDetailDto(
    LogDiagnosticsIncidentDto incident,
    List<LogDiagnosticsFindingDto> findings,
    List<LogDiagnosticsEventDto> timeline
) {
}
