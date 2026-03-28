package com.dk_power.power_plant_java.dto.admin;

import java.util.List;

public record SyncAuditRecentEntityDto(
    Long entityId,
    long totalChanges,
    String firstChangeAt,
    String lastChangeAt,
    String latestChangeType,
    String latestFieldName,
    String latestMachineId,
    String latestMachineName,
    SyncAuditSignalDto signals,
    List<String> warnings
) {
}
