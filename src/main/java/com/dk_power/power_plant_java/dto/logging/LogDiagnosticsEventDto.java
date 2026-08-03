package com.dk_power.power_plant_java.dto.logging;

import java.time.Instant;

public record LogDiagnosticsEventDto(
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
    Long durationMs,
    String eventId,
    String logicalEventId
) {
    /**
     * Compatibility constructor for parser/tests written before opaque event ids were added.
     * File-backed events receive their id from {@code LogDiagnosticsFileService}.
     */
    public LogDiagnosticsEventDto(
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
        this(
            timestamp, level, subsystem, sourceFile, logger, thread, eventCode, message, details,
            requestId, userId, machineId, jobName, jobRunId, syncRunId, entityType, entityId,
            sharepointId, method, path, remoteIp, status, durationMs, null, null
        );
    }

    /** Compatibility constructor for callers that provide a single stable event id. */
    public LogDiagnosticsEventDto(
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
        Long durationMs,
        String eventId
    ) {
        this(
            timestamp, level, subsystem, sourceFile, logger, thread, eventCode, message, details,
            requestId, userId, machineId, jobName, jobRunId, syncRunId, entityType, entityId,
            sharepointId, method, path, remoteIp, status, durationMs, eventId, eventId
        );
    }

    public LogDiagnosticsEventDto withEventId(String id) {
        return withEventIdentity(id, id);
    }

    public LogDiagnosticsEventDto withEventIdentity(String id, String logicalId) {
        return new LogDiagnosticsEventDto(
            timestamp, level, subsystem, sourceFile, logger, thread, eventCode, message, details,
            requestId, userId, machineId, jobName, jobRunId, syncRunId, entityType, entityId,
            sharepointId, method, path, remoteIp, status, durationMs, id, logicalId
        );
    }
}
