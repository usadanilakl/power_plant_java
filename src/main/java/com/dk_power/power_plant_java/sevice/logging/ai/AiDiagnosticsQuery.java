package com.dk_power.power_plant_java.sevice.logging.ai;

import java.time.Instant;
import java.util.Set;

public record AiDiagnosticsQuery(
    Instant from,
    Instant to,
    int limit,
    String cursor,
    AiDiagnosticsSort sort,
    Set<String> levels,
    String text,
    String sourceFile,
    String subsystem,
    String eventCode,
    String requestId,
    String syncRunId,
    String machineId
) {
    public AiDiagnosticsQuery {
        levels = levels == null ? Set.of() : Set.copyOf(levels);
    }
}
