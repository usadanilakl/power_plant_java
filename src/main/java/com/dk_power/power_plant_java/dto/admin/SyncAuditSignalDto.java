package com.dk_power.power_plant_java.dto.admin;

public record SyncAuditSignalDto(
    boolean currentRowMissing,
    boolean currentSoftDeleted,
    boolean multipleCreates,
    boolean deleteThenRecreate,
    boolean relationshipDetachDetected,
    boolean currentCreatedAfterHistory,
    boolean identicalCreatedModified,
    boolean timelineFiltered
) {
}
