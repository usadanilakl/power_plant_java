package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventDto;
import org.springframework.stereotype.Component;

@Component
public class AiDiagnosticsEventMapper {

    private final AiDiagnosticsCursorCodec cursorCodec;

    public AiDiagnosticsEventMapper(AiDiagnosticsCursorCodec cursorCodec) {
        this.cursorCodec = cursorCodec;
    }

    public AiDiagnosticsEventDto map(LogDiagnosticsEventDto event) {
        return new AiDiagnosticsEventDto(
            cursorCodec.encode(event.timestamp(), event.eventId()),
            event.logicalEventId(),
            event.timestamp(),
            event.level(),
            event.subsystem(),
            event.sourceFile(),
            event.logger(),
            event.thread(),
            event.eventCode(),
            event.message(),
            event.details(),
            event.requestId(),
            event.userId(),
            event.machineId(),
            event.jobName(),
            event.jobRunId(),
            event.syncRunId(),
            event.entityType(),
            event.entityId(),
            event.sharepointId(),
            event.method(),
            event.path(),
            event.remoteIp(),
            event.status(),
            event.durationMs()
        );
    }

}
