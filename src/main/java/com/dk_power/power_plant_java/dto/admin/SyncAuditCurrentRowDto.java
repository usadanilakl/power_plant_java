package com.dk_power.power_plant_java.dto.admin;

import java.util.Map;

public record SyncAuditCurrentRowDto(
    String tableName,
    boolean rowExists,
    Boolean deleted,
    String dateCreated,
    String dateModified,
    Long version,
    Map<String, Object> rawRow
) {
}
