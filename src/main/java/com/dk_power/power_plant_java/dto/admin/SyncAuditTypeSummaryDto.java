package com.dk_power.power_plant_java.dto.admin;

public record SyncAuditTypeSummaryDto(
    String entityType,
    long changeCount,
    long entityCount,
    String latestChangeAt,
    boolean registered
) {
}
