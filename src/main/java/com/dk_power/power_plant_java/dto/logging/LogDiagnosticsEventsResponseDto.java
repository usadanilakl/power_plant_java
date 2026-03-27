package com.dk_power.power_plant_java.dto.logging;

import java.util.List;

public record LogDiagnosticsEventsResponseDto(
    int totalMatched,
    List<LogDiagnosticsEventDto> events
) {
}
