package com.dk_power.power_plant_java.dto.logging.ai;

import java.time.Instant;

/** Sanitized, stable event representation exposed to diagnostic agents. */
public record AiDiagnosticsEventDto(
    String id,
    String logicalId,
    Instant timestamp,
    String level,
    String subsystem,
    String sourceFile,
    String logger,
    String thread,
    String eventCode,
    String message,
    String details,
    String requestId,
    String userId,
    String machineId,
    String jobName,
    String jobRunId,
    String syncRunId,
    String entityType,
    String entityId,
    String sharepointId,
    String method,
    String path,
    String remoteIp,
    Integer status,
    Long durationMs
) {
}
