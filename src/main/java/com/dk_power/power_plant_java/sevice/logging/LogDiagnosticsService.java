package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventsResponseDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class LogDiagnosticsService {

    private final LogDiagnosticsFileService fileService;

    public LogDiagnosticsEventsResponseDto getEvents(
        int windowMinutes,
        int limit,
        String level,
        String text,
        String sourceFile,
        String requestId,
        String syncRunId,
        String machineId
    ) {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(Math.max(1, windowMinutes)));

        List<LogDiagnosticsEventDto> filtered = fileService.getAllEvents().stream()
            .filter(event -> event.timestamp() != null && !event.timestamp().isBefore(cutoff))
            .filter(event -> matchesLevel(event, level))
            .filter(event -> matchesSource(event, sourceFile))
            .filter(event -> matchesText(event, text))
            .filter(event -> matchesValue(event.requestId(), requestId))
            .filter(event -> matchesValue(event.syncRunId(), syncRunId))
            .filter(event -> matchesValue(event.machineId(), machineId))
            .sorted(Comparator.comparing(LogDiagnosticsEventDto::timestamp).reversed())
            .toList();

        int total = filtered.size();
        int cappedLimit = Math.max(1, Math.min(limit, 500));

        int infoCount = 0, warnCount = 0, errorCount = 0;
        for (LogDiagnosticsEventDto event : filtered) {
            switch (event.level().toUpperCase(Locale.ROOT)) {
                case "INFO" -> infoCount++;
                case "WARN" -> warnCount++;
                case "ERROR" -> errorCount++;
            }
        }

        return new LogDiagnosticsEventsResponseDto(
            total,
            new LogDiagnosticsSummaryDto(total, infoCount, warnCount, errorCount),
            fileService.getSourceFileNames(),
            filtered.stream().limit(cappedLimit).toList()
        );
    }

    private boolean matchesLevel(LogDiagnosticsEventDto event, String level) {
        return level == null || level.isBlank() || "ALL".equalsIgnoreCase(level)
            || level.equalsIgnoreCase(event.level());
    }

    private boolean matchesSource(LogDiagnosticsEventDto event, String sourceFile) {
        return sourceFile == null || sourceFile.isBlank()
            || sourceFile.equalsIgnoreCase(event.sourceFile());
    }

    private boolean matchesValue(String actual, String expected) {
        return expected == null || expected.isBlank()
            || Objects.equals(normalize(actual), normalize(expected));
    }

    private boolean matchesText(LogDiagnosticsEventDto event, String text) {
        if (text == null || text.isBlank()) {
            return true;
        }
        String needle = text.toLowerCase(Locale.ROOT);
        return contains(event.message(), needle)
            || contains(event.details(), needle)
            || contains(event.logger(), needle)
            || contains(event.subsystem(), needle)
            || contains(event.eventCode(), needle)
            || contains(event.path(), needle);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
