package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventsResponseDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsFindingDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentDetailDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentsResponseDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsOverviewDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class LogDiagnosticsService {

    private final LogDiagnosticsFileService fileService;
    private final LogDiagnosticsParserService parserService;
    private final LogDiagnosticsAnalyzerService analyzerService;
    private final LogDiagnosticsIncidentService incidentService;

    public LogDiagnosticsOverviewDto getOverview(int windowMinutes, int limit) {
        List<LogDiagnosticsEventDto> events = loadEvents(windowMinutes);
        List<LogDiagnosticsFindingDto> findings = analyzerService.analyze(events);
        List<LogDiagnosticsIncidentDto> incidents = incidentService.buildIncidents(findings, events, 12, null);
        List<LogDiagnosticsEventDto> recentEvents = events.stream()
            .limit(Math.max(1, Math.min(limit, 200)))
            .toList();

        int infoCount = (int) events.stream().filter(event -> "INFO".equalsIgnoreCase(event.level())).count();
        int warnCount = (int) events.stream().filter(event -> "WARN".equalsIgnoreCase(event.level())).count();
        int errorCount = (int) events.stream().filter(event -> "ERROR".equalsIgnoreCase(event.level())).count();
        int criticalCount = (int) findings.stream().filter(finding -> "critical".equalsIgnoreCase(finding.severity())).count();

        return new LogDiagnosticsOverviewDto(
            Instant.now(),
            windowMinutes,
            new LogDiagnosticsSummaryDto(events.size(), infoCount, warnCount, errorCount, findings.size(), criticalCount),
            new ArrayList<>(fileService.readCurrentLogFiles().keySet()),
            incidents,
            findings.stream().limit(20).toList(),
            recentEvents
        );
    }

    public LogDiagnosticsIncidentsResponseDto getIncidents(int windowMinutes, int limit, String status) {
        List<LogDiagnosticsEventDto> events = loadEvents(windowMinutes);
        List<LogDiagnosticsFindingDto> findings = analyzerService.analyze(events);
        return incidentService.buildIncidentResponse(findings, events, limit, status);
    }

    public LogDiagnosticsIncidentDetailDto getIncidentDetail(String incidentId, int windowMinutes, int timelineLimit) {
        List<LogDiagnosticsEventDto> events = loadEvents(windowMinutes);
        List<LogDiagnosticsFindingDto> findings = analyzerService.analyze(events);
        return incidentService.getIncidentDetail(incidentId, findings, events, timelineLimit);
    }

    public LogDiagnosticsIncidentDto updateIncidentStatus(String incidentId, String status, int windowMinutes) {
        List<LogDiagnosticsEventDto> events = loadEvents(windowMinutes);
        List<LogDiagnosticsFindingDto> findings = analyzerService.analyze(events);
        return incidentService.updateStatus(incidentId, status, findings, events);
    }

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
        List<LogDiagnosticsEventDto> filtered = loadEvents(windowMinutes).stream()
            .filter(event -> matchesLevel(event, level))
            .filter(event -> matchesSource(event, sourceFile))
            .filter(event -> matchesText(event, text))
            .filter(event -> matchesValue(event.requestId(), requestId))
            .filter(event -> matchesValue(event.syncRunId(), syncRunId))
            .filter(event -> matchesValue(event.machineId(), machineId))
            .toList();

        return new LogDiagnosticsEventsResponseDto(
            filtered.size(),
            filtered.stream().limit(Math.max(1, Math.min(limit, 500))).toList()
        );
    }

    private List<LogDiagnosticsEventDto> loadEvents(int windowMinutes) {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(Math.max(1, windowMinutes)));
        Map<String, List<String>> files = fileService.readCurrentLogFiles();
        List<LogDiagnosticsEventDto> events = new ArrayList<>();

        files.forEach((sourceFile, lines) -> events.addAll(parserService.parse(sourceFile, lines)));

        return events.stream()
            .filter(event -> event.timestamp() != null && !event.timestamp().isBefore(cutoff))
            .sorted(Comparator.comparing(LogDiagnosticsEventDto::timestamp).reversed())
            .toList();
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
