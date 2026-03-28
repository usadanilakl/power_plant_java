package com.dk_power.power_plant_java.dto.admin;

public record SyncAuditMachineSummaryDto(
    String machineId,
    String machineName,
    long changeCount,
    String firstChangeAt,
    String lastChangeAt
) {
}
