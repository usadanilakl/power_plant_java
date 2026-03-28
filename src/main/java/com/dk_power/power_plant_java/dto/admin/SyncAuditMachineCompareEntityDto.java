package com.dk_power.power_plant_java.dto.admin;

public record SyncAuditMachineCompareEntityDto(
    Long entityId,
    long leftCount,
    long rightCount,
    String leftLastChangeAt,
    String rightLastChangeAt,
    String status
) {
}
