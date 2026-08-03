package com.dk_power.power_plant_java.dto.logging;

import java.util.List;

public record LogDiagnosticsEventsResponseDto(
    int totalMatched,
    LogDiagnosticsSummaryDto summary,
    List<String> sourceFiles,
    List<String> subsystems,
    List<String> eventCodes,
    List<LogDiagnosticsEventDto> events,
    String nextCursor,
    boolean hasMore,
    boolean truncated
) {
    public LogDiagnosticsEventsResponseDto(
        int totalMatched,
        LogDiagnosticsSummaryDto summary,
        List<String> sourceFiles,
        List<String> subsystems,
        List<String> eventCodes,
        List<LogDiagnosticsEventDto> events
    ) {
        this(totalMatched, summary, sourceFiles, subsystems, eventCodes, events, null, false, false);
    }
}
