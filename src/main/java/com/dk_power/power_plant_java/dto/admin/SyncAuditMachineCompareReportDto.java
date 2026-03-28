package com.dk_power.power_plant_java.dto.admin;

import java.util.List;

public record SyncAuditMachineCompareReportDto(
    String entityType,
    String leftMachineId,
    String rightMachineId,
    int totalCompared,
    int leftOnlyCount,
    int rightOnlyCount,
    int bothCount,
    int divergentCount,
    List<SyncAuditMachineCompareEntityDto> entities
) {
}
