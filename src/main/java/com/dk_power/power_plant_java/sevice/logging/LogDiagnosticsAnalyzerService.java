package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsFindingDto;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LogDiagnosticsAnalyzerService {

    public List<LogDiagnosticsFindingDto> analyze(List<LogDiagnosticsEventDto> events) {
        Map<String, FindingAccumulator> findings = new LinkedHashMap<>();

        for (LogDiagnosticsEventDto event : events) {
            String message = event.message() == null ? "" : event.message();
            String lowerMessage = message.toLowerCase();
            String lowerLogger = event.logger() == null ? "" : event.logger().toLowerCase();

            if (lowerMessage.contains("connection is not available") ||
                lowerMessage.contains("cannotcreatetransactionexception")) {
                addFinding(
                    findings,
                    "DB_CONNECTION_TIMEOUT|" + safe(event.machineId()),
                    "DB_CONNECTION_TIMEOUT",
                    "critical",
                    "Database",
                    "Database connection acquisition failures",
                    "Requests or scheduled jobs could not acquire JDBC connections from Hikari.",
                    "Inspect long-running transactions, database saturation, and recent db.pool.pressure events.",
                    event
                );
            }

            if (lowerMessage.startsWith("db.pool.pressure")) {
                addFinding(
                    findings,
                    "DB_POOL_PRESSURE|" + safe(event.machineId()),
                    "DB_POOL_PRESSURE",
                    "warning",
                    "Database",
                    "Database pool pressure detected",
                    "Hikari pool utilization is high or threads are waiting for a connection.",
                    "Check for long-running transactions and expensive file or SharePoint work inside transactional boundaries.",
                    event
                );
            }

            if (lowerMessage.startsWith("http.request.failed")) {
                String path = safe(event.path());
                addFinding(
                    findings,
                    "HTTP_REQUEST_FAILURE|" + path,
                    "HTTP_REQUEST_FAILURE",
                    "warning",
                    "HTTP",
                    "HTTP request failures detected",
                    "Requests are failing repeatedly for the same endpoint.",
                    "Review related requestId traces and the backing service logs for this endpoint.",
                    event
                );
            }

            if (lowerMessage.contains("circuit_breaker")) {
                addFinding(
                    findings,
                    "CIRCUIT_BREAKER_ACTIVITY|" + event.subsystem(),
                    "CIRCUIT_BREAKER_ACTIVITY",
                    "warning",
                    event.subsystem(),
                    "Circuit breaker activity detected",
                    "A circuit breaker reset or self-heal event was logged.",
                    "Check upstream availability and recent retry or timeout events in the same subsystem.",
                    event
                );
            }

            if ((lowerLogger.contains(".sevice.sync") || lowerLogger.contains(".sevice.sharepoint") || lowerLogger.contains(".sevice.hub"))
                && ("WARN".equalsIgnoreCase(event.level()) || "ERROR".equalsIgnoreCase(event.level()))) {
                addFinding(
                    findings,
                    "SYNC_DEGRADED|" + event.subsystem() + "|" + safe(event.machineId()),
                    "SYNC_DEGRADED",
                    "warning",
                    event.subsystem(),
                    "Sync subsystem warnings/errors detected",
                    "The sync subsystem is emitting warnings or errors in the selected time window.",
                    "Open the recent event list and filter by syncRunId or machineId to inspect the sequence.",
                    event
                );
            }

            if (lowerMessage.contains("file_sync.recovered_uploads") || lowerMessage.contains("scheduled retry")) {
                addFinding(
                    findings,
                    "FILE_SYNC_RETRY_ACTIVITY|" + safe(event.machineId()),
                    "FILE_SYNC_RETRY_ACTIVITY",
                    "info",
                    "Sync",
                    "File sync retry activity detected",
                    "File sync retries or recovery actions were observed.",
                    "Inspect network connectivity and file queue health if retry activity keeps climbing.",
                    event
                );
            }
        }

        return findings.values().stream()
            .map(FindingAccumulator::toDto)
            .sorted(Comparator
                .comparingInt((LogDiagnosticsFindingDto finding) -> severityRank(finding.severity()))
                .thenComparing(LogDiagnosticsFindingDto::lastSeen, Comparator.reverseOrder()))
            .toList();
    }

    private void addFinding(
        Map<String, FindingAccumulator> findings,
        String key,
        String type,
        String severity,
        String subsystem,
        String title,
        String summary,
        String recommendation,
        LogDiagnosticsEventDto event
    ) {
        findings.computeIfAbsent(
            key,
            ignored -> new FindingAccumulator(type, severity, subsystem, title, summary, recommendation, event.machineId(), event.path())
        ).add(event);
    }

    private int severityRank(String severity) {
        return switch (severity) {
            case "critical" -> 0;
            case "warning" -> 1;
            default -> 2;
        };
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "global" : value;
    }

    private static final class FindingAccumulator {
        private final String type;
        private final String severity;
        private final String subsystem;
        private final String title;
        private final String summary;
        private final String recommendation;
        private final String machineId;
        private final String path;
        private int count = 0;
        private Instant firstSeen;
        private Instant lastSeen;
        private String sampleMessage;

        private FindingAccumulator(
            String type,
            String severity,
            String subsystem,
            String title,
            String summary,
            String recommendation,
            String machineId,
            String path
        ) {
            this.type = type;
            this.severity = severity;
            this.subsystem = subsystem;
            this.title = title;
            this.summary = summary;
            this.recommendation = recommendation;
            this.machineId = machineId;
            this.path = path;
        }

        private void add(LogDiagnosticsEventDto event) {
            count++;
            if (firstSeen == null || event.timestamp().isBefore(firstSeen)) {
                firstSeen = event.timestamp();
            }
            if (lastSeen == null || event.timestamp().isAfter(lastSeen)) {
                lastSeen = event.timestamp();
            }
            if (sampleMessage == null) {
                sampleMessage = event.message();
            }
        }

        private LogDiagnosticsFindingDto toDto() {
            return new LogDiagnosticsFindingDto(
                type + "|" + safeValue(machineId) + "|" + safeValue(path),
                type,
                severity,
                subsystem,
                title,
                summary,
                recommendation,
                count,
                firstSeen,
                lastSeen,
                machineId,
                path,
                sampleMessage
            );
        }

        private String safeValue(String value) {
            return value == null || value.isBlank() ? "global" : value;
        }
    }
}
