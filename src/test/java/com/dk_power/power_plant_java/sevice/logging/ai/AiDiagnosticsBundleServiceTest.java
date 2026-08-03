package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsProperties;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsBundleRequestDto;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiDiagnosticsBundleServiceTest {

    @Test
    void createsBoundedImmediateNdjsonSnapshot() {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();
        AiDiagnosticsEventDto event = event("cursor-1", "sanitized message");
        AiDiagnosticsQueryService queryService = new AiDiagnosticsQueryService(properties,
            query -> new AiDiagnosticsEventPage(List.of(event), null, false, false));
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        AiDiagnosticsBundleService service = new AiDiagnosticsBundleService(
            properties, queryService, objectMapper, "test-app");

        var result = service.create("agent", new AiDiagnosticsBundleRequestDto(
            null, null, 1, "ERROR", null, null, null, null, null, null, null));

        String ndjson = new String(result.content(), StandardCharsets.UTF_8);
        String[] lines = ndjson.stripTrailing().split("\\R");
        assertEquals(2, lines.length);
        assertTrue(lines[0].contains("\"type\":\"manifest\""));
        assertTrue(lines[0].contains("\"sanitized\":true"));
        assertTrue(lines[1].contains("sanitized message"));
        assertEquals(1, result.eventCount());
    }

    private AiDiagnosticsEventDto event(String id, String message) {
        return new AiDiagnosticsEventDto(
            id, id, Instant.now(), "ERROR", "Application", "app.log", "logger", "thread",
            "app.failed", message, null, "request", null, null, null, null, null,
            null, null, null, null, null, null, 500, 10L);
    }
}
