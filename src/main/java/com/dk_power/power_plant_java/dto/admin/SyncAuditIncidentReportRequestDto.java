package com.dk_power.power_plant_java.dto.admin;

public record SyncAuditIncidentReportRequestDto(
    String entityType,
    Long entityId,
    int limit,
    String machineId,
    String fieldName,
    String changeType,
    String from,
    String to,
    String leftMachineId,
    String rightMachineId,
    int compareLimit,
    String asOf
) {
}
