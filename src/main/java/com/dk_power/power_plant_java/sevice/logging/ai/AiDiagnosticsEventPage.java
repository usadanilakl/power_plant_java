package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventDto;

import java.util.List;

public record AiDiagnosticsEventPage(
    List<AiDiagnosticsEventDto> events,
    String nextCursor,
    boolean hasMore,
    boolean truncated
) {
    public AiDiagnosticsEventPage {
        events = List.copyOf(events);
    }
}
