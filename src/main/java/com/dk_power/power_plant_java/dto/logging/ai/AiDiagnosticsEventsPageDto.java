package com.dk_power.power_plant_java.dto.logging.ai;

import java.time.Instant;
import java.util.List;

public record AiDiagnosticsEventsPageDto(
    Instant generatedAt,
    List<AiDiagnosticsEventDto> events,
    String nextCursor,
    boolean hasMore,
    boolean truncated
) {
    public AiDiagnosticsEventsPageDto {
        events = List.copyOf(events);
    }
}
