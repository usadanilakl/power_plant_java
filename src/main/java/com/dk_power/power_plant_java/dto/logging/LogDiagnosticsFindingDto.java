package com.dk_power.power_plant_java.dto.logging;

import java.time.Instant;

public record LogDiagnosticsFindingDto(
    String groupKey,
    String type,
    String severity,
    String subsystem,
    String title,
    String summary,
    String recommendation,
    int count,
    Instant firstSeen,
    Instant lastSeen,
    String machineId,
    String path,
    String sampleMessage
) {
}
