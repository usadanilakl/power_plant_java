package com.dk_power.power_plant_java.dto.logging;

import java.time.Instant;
import java.util.List;

public record LogDiagnosticsIncidentDto(
    String incidentId,
    String incidentKey,
    String status,
    String severity,
    String subsystem,
    String title,
    String summary,
    String recommendation,
    String suspectedCause,
    int count,
    Instant firstSeen,
    Instant lastSeen,
    String machineId,
    String path,
    String requestId,
    String syncRunId,
    List<String> findingTypes
) {
}
