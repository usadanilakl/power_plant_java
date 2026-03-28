package com.dk_power.power_plant_java.dto.admin;

public record SyncAuditFieldChangeDto(
    String id,
    String timestamp,
    String receivedAt,
    String changeType,
    String fieldName,
    String relationshipType,
    String oldValue,
    String newValue,
    String originMachineId,
    String originMachineName,
    String syncedToMachines
) {
}
