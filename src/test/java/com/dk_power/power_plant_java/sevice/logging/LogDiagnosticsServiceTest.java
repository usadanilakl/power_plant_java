package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventsResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LogDiagnosticsServiceTest {

    private static final Instant NOW = Instant.parse("2026-08-02T18:00:00Z");

    private LogDiagnosticsFileService fileService;
    private LogDiagnosticsService service;

    @BeforeEach
    void setUp() {
        fileService = mock(LogDiagnosticsFileService.class);
        when(fileService.getSourceFileNames()).thenReturn(List.of(
            "power-plant-alerts.log", "power-plant-sync.log", "power-plant-security.log",
            "power-plant-logger.log"
        ));
        service = new LogDiagnosticsService(fileService, new LogDiagnosticsRedactionService());
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void paginatesWithOpaqueStableCursorAndDeduplicatesMirroredAlerts() {
        LogDiagnosticsEventDto newest = event("event-0001", NOW.minusSeconds(60), "app.newest", "newest", "power-plant-logger.log");
        LogDiagnosticsEventDto middle = event("event-0002", NOW.minusSeconds(120), "sync.failed", "failure", "power-plant-sync.log");
        LogDiagnosticsEventDto mirrored = event("event-alert2", NOW.minusSeconds(120), "sync.failed", "failure", "power-plant-alerts.log");
        LogDiagnosticsEventDto oldest = event("event-0003", NOW.minusSeconds(180), "app.oldest", "oldest", "power-plant-logger.log");
        when(fileService.getSnapshot()).thenReturn(
            new LogDiagnosticsFileService.LogFilesSnapshot(List.of(mirrored, oldest, newest, middle), false)
        );

        LogDiagnosticsEventsResponseDto first = query(2, null, null);
        LogDiagnosticsEventsResponseDto second = query(2, first.nextCursor(), null);

        assertThat(first.totalMatched()).isEqualTo(3);
        assertThat(first.events()).extracting(LogDiagnosticsEventDto::eventId)
            .containsExactly("event-0001", "event-0002");
        assertThat(first.hasMore()).isTrue();
        assertThat(first.nextCursor()).isNotBlank().doesNotContain("event-0002");
        assertThat(second.events()).extracting(LogDiagnosticsEventDto::eventId)
            .containsExactly("event-0003");
        assertThat(second.hasMore()).isFalse();
        assertThat(first.events()).noneMatch(event -> "power-plant-alerts.log".equals(event.sourceFile()));
    }

    @Test
    void redactsBeforeCallerControlledSearchAndCounts() {
        String rawSecret = "unguessable-secret-value";
        LogDiagnosticsEventDto secretEvent = event(
            "event-0004", NOW.minusSeconds(30), "auth.failed", "password=" + rawSecret,
            "power-plant-security.log"
        );
        when(fileService.getSnapshot()).thenReturn(
            new LogDiagnosticsFileService.LogFilesSnapshot(List.of(secretEvent), false)
        );

        LogDiagnosticsEventsResponseDto probingRaw = query(10, null, rawSecret);
        LogDiagnosticsEventsResponseDto searchingSanitized = query(10, null, "[REDACTED]");

        assertThat(probingRaw.totalMatched()).isZero();
        assertThat(probingRaw.events()).isEmpty();
        assertThat(searchingSanitized.totalMatched()).isOne();
        assertThat(searchingSanitized.events().getFirst().message())
            .isEqualTo("password=[REDACTED]")
            .doesNotContain(rawSecret);
    }

    private LogDiagnosticsEventsResponseDto query(int limit, String cursor, String text) {
        return service.getEvents(
            240, limit, "ALL", text, null, null, null, null, null, null,
            NOW.minusSeconds(600), NOW, cursor, "desc"
        );
    }

    private LogDiagnosticsEventDto event(
        String id,
        Instant timestamp,
        String eventCode,
        String message,
        String sourceFile
    ) {
        return new LogDiagnosticsEventDto(
            timestamp, eventCode.contains("failed") ? "ERROR" : "INFO", "Application", sourceFile,
            "example.Logger", "main", eventCode, message, null, "request-1", "user-1",
            "machine-1", null, null, null, null, null, null, null, null, null,
            null, null, id
        );
    }
}
