package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventsResponseDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsSummaryDto;
import com.dk_power.power_plant_java.sevice.logging.LogDiagnosticsService;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LogDiagnosticsAiEventSourceTest {

    @Test
    void paginatesMixedLevelsWithStableSourceIdTieBreakAtSameTimestamp() {
        Instant timestamp = Instant.parse("2026-08-02T12:00:00Z");
        AiDiagnosticsCursorCodec codec = new AiDiagnosticsCursorCodec();
        LogDiagnosticsAiEventSource source = new LogDiagnosticsAiEventSource(
            new MixedLevelDiagnosticsService(timestamp), new AiDiagnosticsEventMapper(codec), codec);
        AiDiagnosticsQuery firstQuery = new AiDiagnosticsQuery(
            timestamp.minusSeconds(1), timestamp.plusSeconds(1), 2, null,
            AiDiagnosticsSort.ASC, Set.of("WARN", "ERROR"),
            null, null, null, null, null, null, null);

        AiDiagnosticsEventPage first = source.query(firstQuery);
        AiDiagnosticsEventPage second = source.query(new AiDiagnosticsQuery(
            firstQuery.from(), firstQuery.to(), 2, first.nextCursor(),
            AiDiagnosticsSort.ASC, firstQuery.levels(),
            null, null, null, null, null, null, null));

        assertEquals(List.of("event-AAA", "event-BBB"), sourceIds(first.events(), codec));
        assertEquals(List.of("event-AAA", "event-BBB"),
            first.events().stream().map(event -> event.logicalId()).toList());
        assertTrue(first.hasMore());
        assertEquals(List.of("event-CCC", "event-DDD"), sourceIds(second.events(), codec));
        assertFalse(second.hasMore());
    }

    private List<String> sourceIds(
        List<com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventDto> events,
        AiDiagnosticsCursorCodec codec
    ) {
        return events.stream().map(event -> codec.decode(event.id()).sourceEventId()).toList();
    }

    private static final class MixedLevelDiagnosticsService extends LogDiagnosticsService {
        private final Instant timestamp;

        private MixedLevelDiagnosticsService(Instant timestamp) {
            super(null, null);
            this.timestamp = timestamp;
        }

        @Override
        public String createCursor(Instant timestamp, String eventId, String sort) {
            return eventId;
        }

        @Override
        public LogDiagnosticsEventsResponseDto getEvents(
            int windowMinutes,
            int limit,
            String level,
            String text,
            String sourceFile,
            String subsystem,
            String eventCode,
            String requestId,
            String syncRunId,
            String machineId,
            Instant from,
            Instant to,
            String cursor,
            String sort
        ) {
            List<LogDiagnosticsEventDto> events;
            if (cursor == null && "WARN".equals(level)) {
                events = List.of(event("WARN", "event-AAA"), event("WARN", "event-CCC"));
            } else if (cursor == null && "ERROR".equals(level)) {
                events = List.of(event("ERROR", "event-BBB"), event("ERROR", "event-DDD"));
            } else if ("WARN".equals(level)) {
                events = List.of(event("WARN", "event-CCC"));
            } else {
                events = List.of(event("ERROR", "event-DDD"));
            }
            return new LogDiagnosticsEventsResponseDto(
                events.size(), new LogDiagnosticsSummaryDto(events.size(), 0, 0, 0),
                List.of("app.log"), List.of("Application"), List.of(), events,
                null, false, false);
        }

        private LogDiagnosticsEventDto event(String level, String id) {
            return new LogDiagnosticsEventDto(
                timestamp, level, "Application", "app.log", "logger", "thread", null,
                id, null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, id);
        }
    }
}
