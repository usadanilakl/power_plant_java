package com.dk_power.power_plant_java.dto.admin;

import java.util.List;
import java.util.Map;

public record SyncAuditReconstructionDto(
    String entityType,
    Long entityId,
    String asOf,
    long appliedChangeCount,
    List<String> machinesSeen,
    Map<String, String> reconstructedFields,
    List<SyncAuditReconstructedFieldDiffDto> diffsFromCurrent,
    List<String> warnings
) {
}
