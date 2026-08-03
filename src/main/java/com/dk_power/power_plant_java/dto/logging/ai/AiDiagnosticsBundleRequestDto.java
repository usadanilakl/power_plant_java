package com.dk_power.power_plant_java.dto.logging.ai;

import java.time.Instant;

public record AiDiagnosticsBundleRequestDto(
    Instant from,
    Instant to,
    Integer limit,
    String levels,
    String text,
    String sourceFile,
    String subsystem,
    String eventCode,
    String requestId,
    String syncRunId,
    String machineId
) {
}
