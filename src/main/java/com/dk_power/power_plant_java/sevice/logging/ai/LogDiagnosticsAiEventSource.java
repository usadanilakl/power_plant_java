package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventDto;
import com.dk_power.power_plant_java.sevice.logging.LogDiagnosticsService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Adapts the application's sanitized diagnostics query service to the agent API.
 * Redaction remains owned by {@link LogDiagnosticsService}; this adapter must
 * never read raw log files directly.
 */
@Service
public class LogDiagnosticsAiEventSource implements AiDiagnosticsEventSource {

    private final LogDiagnosticsService diagnosticsService;
    private final AiDiagnosticsEventMapper mapper;
    private final AiDiagnosticsCursorCodec cursorCodec;

    public LogDiagnosticsAiEventSource(
        LogDiagnosticsService diagnosticsService,
        AiDiagnosticsEventMapper mapper,
        AiDiagnosticsCursorCodec cursorCodec
    ) {
        this.diagnosticsService = diagnosticsService;
        this.mapper = mapper;
        this.cursorCodec = cursorCodec;
    }

    @Override
    public AiDiagnosticsEventPage query(AiDiagnosticsQuery query) {
        AiDiagnosticsCursorCodec.DecodedCursor cursor = cursorCodec.decode(query.cursor());
        Instant delegatedFrom = query.from();
        Instant delegatedTo = query.to();
        if (cursor != null) {
            if (query.sort() == AiDiagnosticsSort.ASC && cursor.timestamp().isAfter(delegatedFrom)) {
                delegatedFrom = cursor.timestamp();
            }
            if (query.sort() == AiDiagnosticsSort.DESC && cursor.timestamp().isBefore(delegatedTo)) {
                delegatedTo = cursor.timestamp();
            }
        }

        List<String> delegatedLevels = query.levels().isEmpty()
            ? Collections.singletonList(null)
            : new ArrayList<>(query.levels());
        List<AiDiagnosticsEventDto> candidates = new ArrayList<>();
        boolean sourceHasMore = false;
        boolean sourceTruncated = false;
        int delegatedLimit = Math.min(5000, query.limit() + 1);
        String sort = query.sort().name().toLowerCase(Locale.ROOT);
        String sourceCursor = cursor == null ? null : diagnosticsService.createCursor(
            cursor.timestamp(), cursor.sourceEventId(), sort);

        for (String level : delegatedLevels) {
            var response = diagnosticsService.getEvents(
                1,
                delegatedLimit,
                level,
                query.text(),
                query.sourceFile(),
                query.subsystem(),
                query.eventCode(),
                query.requestId(),
                query.syncRunId(),
                query.machineId(),
                delegatedFrom,
                delegatedTo,
                sourceCursor,
                sort
            );
            response.events().stream().map(mapper::map).forEach(candidates::add);
            sourceHasMore |= response.hasMore();
            sourceTruncated |= response.truncated();
        }

        Comparator<AiDiagnosticsEventDto> naturalOrder = Comparator
            .comparing(AiDiagnosticsEventDto::timestamp)
            .thenComparing(event -> cursorCodec.decode(event.id()).sourceEventId());
        Comparator<AiDiagnosticsEventDto> requestedOrder = query.sort() == AiDiagnosticsSort.ASC
            ? naturalOrder : naturalOrder.reversed();

        List<AiDiagnosticsEventDto> matching = candidates.stream()
            .filter(event -> event.timestamp() != null)
            .filter(event -> !event.timestamp().isBefore(query.from()) && !event.timestamp().isAfter(query.to()))
            .filter(event -> query.levels().isEmpty() || query.levels().contains(event.level().toUpperCase()))
            .filter(event -> cursor == null || isAfterCursor(event, cursor, query.sort()))
            .sorted(requestedOrder)
            .toList();

        boolean hasMore = sourceHasMore || matching.size() > query.limit();
        List<AiDiagnosticsEventDto> page = matching.stream().limit(query.limit()).toList();
        String nextCursor = page.isEmpty() ? null : page.get(page.size() - 1).id();
        return new AiDiagnosticsEventPage(page, nextCursor, hasMore, sourceTruncated);
    }

    private boolean isAfterCursor(
        AiDiagnosticsEventDto event,
        AiDiagnosticsCursorCodec.DecodedCursor cursor,
        AiDiagnosticsSort sort
    ) {
        AiDiagnosticsCursorCodec.DecodedCursor eventCursor = cursorCodec.decode(event.id());
        int timestampComparison = event.timestamp().compareTo(cursor.timestamp());
        int comparison = timestampComparison != 0
            ? timestampComparison
            : eventCursor.sourceEventId().compareTo(cursor.sourceEventId());
        return sort == AiDiagnosticsSort.ASC ? comparison > 0 : comparison < 0;
    }
}
