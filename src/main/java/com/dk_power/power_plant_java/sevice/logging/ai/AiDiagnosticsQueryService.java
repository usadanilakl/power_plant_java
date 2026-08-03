package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsProperties;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventsPageDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.DateTimeException;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AiDiagnosticsQueryService {

    private final AiDiagnosticsProperties properties;
    private final AiDiagnosticsEventSource eventSource;

    public AiDiagnosticsQueryService(
        AiDiagnosticsProperties properties,
        AiDiagnosticsEventSource eventSource
    ) {
        this.properties = properties;
        this.eventSource = eventSource;
    }

    public AiDiagnosticsEventsPageDto query(
        String identity,
        Instant from,
        Instant to,
        int limit,
        String cursor,
        String sort,
        Set<String> levels,
        String text,
        String sourceFile,
        String subsystem,
        String eventCode,
        String requestId,
        String syncRunId,
        String machineId
    ) {
        Instant now = Instant.now();
        Instant effectiveTo = to == null || to.isAfter(now) ? now : to;
        int maxMinutes = Math.max(1, properties.getMaxHistoricalMinutes());
        Instant earliest;
        try {
            earliest = effectiveTo.minus(Duration.ofMinutes(maxMinutes));
        } catch (DateTimeException | ArithmeticException e) {
            throw new IllegalArgumentException("Diagnostics time range is outside supported bounds", e);
        }
        Instant effectiveFrom = from == null ? earliest : from;
        if (effectiveFrom.isBefore(earliest)) {
            effectiveFrom = earliest;
        }
        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new IllegalArgumentException("from must not be after to");
        }

        int cappedLimit = Math.max(1, Math.min(limit, Math.max(1, properties.getMaxEventsPerResponse())));
        Set<String> normalizedLevels = normalizeLevels(levels);
        String boundedCursor = bounded(cursor, properties.getMaxCursorLength(), "cursor");
        String boundedText = bounded(text, properties.getMaxSearchTextLength(), "text");
        AiDiagnosticsQuery query = new AiDiagnosticsQuery(
            effectiveFrom, effectiveTo, cappedLimit, boundedCursor, AiDiagnosticsSort.parse(sort),
            normalizedLevels, boundedText,
            bounded(sourceFile, properties.getMaxFilterValueLength(), "sourceFile"),
            bounded(subsystem, properties.getMaxFilterValueLength(), "subsystem"),
            bounded(eventCode, properties.getMaxFilterValueLength(), "eventCode"),
            bounded(requestId, properties.getMaxFilterValueLength(), "requestId"),
            bounded(syncRunId, properties.getMaxFilterValueLength(), "syncRunId"),
            bounded(machineId, properties.getMaxFilterValueLength(), "machineId")
        );

        AiDiagnosticsEventPage result = eventSource.query(query);
        log.info("audit.ai_diagnostics.query identity={} from={} to={} returned={} hasMore={} truncated={}",
            identity, effectiveFrom, effectiveTo, result.events().size(), result.hasMore(), result.truncated());
        return new AiDiagnosticsEventsPageDto(
            now, result.events(), result.nextCursor(), result.hasMore(), result.truncated());
    }

    private Set<String> normalizeLevels(Set<String> levels) {
        if (levels == null || levels.isEmpty()) {
            return Set.of();
        }
        Set<String> normalized = levels.stream()
            .filter(value -> value != null && !value.isBlank())
            .map(value -> value.trim().toUpperCase(Locale.ROOT))
            .collect(Collectors.toUnmodifiableSet());
        if (!Set.of("TRACE", "DEBUG", "INFO", "WARN", "ERROR").containsAll(normalized)) {
            throw new IllegalArgumentException("levels contains an unsupported log level");
        }
        return normalized;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String bounded(String value, int configuredMaxLength, String name) {
        String normalized = blankToNull(value);
        int maxLength = Math.max(1, configuredMaxLength);
        if (normalized != null && normalized.length() > maxLength) {
            throw new IllegalArgumentException(name + " exceeds the maximum length of " + maxLength);
        }
        return normalized;
    }
}
