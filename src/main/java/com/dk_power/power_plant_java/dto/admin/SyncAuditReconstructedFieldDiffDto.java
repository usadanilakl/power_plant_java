package com.dk_power.power_plant_java.dto.admin;

public record SyncAuditReconstructedFieldDiffDto(
    String fieldName,
    String reconstructedValue,
    String currentValue
) {
}
