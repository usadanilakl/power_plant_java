package com.dk_power.power_plant_java.dto.admin;

import java.util.List;
import java.util.Map;

public record SyncAuditEntityReportDto(
    String entityType,
    Long entityId,
    long totalChanges,
    long visibleTimelineChanges,
    String firstChangeAt,
    String lastChangeAt,
    Map<String, Long> changeTypeCounts,
    List<String> machines,
    List<String> touchedFields,
    java.util.List<SyncAuditMachineSummaryDto> machineSummaries,
    List<String> warnings,
    SyncAuditSignalDto signals,
    SyncAuditCurrentRowDto currentRow,
    List<SyncAuditRelatedEntityDto> relatedEntities,
    List<SyncAuditFieldChangeDto> timeline
) {
}
