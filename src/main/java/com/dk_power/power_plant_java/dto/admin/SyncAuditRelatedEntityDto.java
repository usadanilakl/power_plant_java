package com.dk_power.power_plant_java.dto.admin;

public record SyncAuditRelatedEntityDto(
    String relation,
    String entityType,
    Long entityId
) {
}
