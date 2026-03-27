package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsFindingDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentDetailDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentsResponseDto;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LogDiagnosticsIncidentService {

    private final Map<String, String> incidentStatuses = new ConcurrentHashMap<>();

    public List<LogDiagnosticsIncidentDto> buildIncidents(
        List<LogDiagnosticsFindingDto> findings,
        List<LogDiagnosticsEventDto> events,
        int limit,
        String status
    ) {
        Map<String, IncidentAccumulator> grouped = new LinkedHashMap<>();

        for (LogDiagnosticsFindingDto finding : findings) {
            IncidentDescriptor descriptor = describeIncident(finding);
            grouped.computeIfAbsent(
                descriptor.incidentKey(),
                ignored -> new IncidentAccumulator(descriptor)
            ).addFinding(finding, events);
        }

        return grouped.values().stream()
            .map(IncidentAccumulator::toDto)
            .filter(incident -> matchesStatus(incident, status))
            .sorted(Comparator
                .comparingInt((LogDiagnosticsIncidentDto incident) -> severityRank(incident.severity()))
                .thenComparing(LogDiagnosticsIncidentDto::lastSeen, Comparator.reverseOrder()))
            .limit(Math.max(1, Math.min(limit, 100)))
            .toList();
    }

    public LogDiagnosticsIncidentsResponseDto buildIncidentResponse(
        List<LogDiagnosticsFindingDto> findings,
        List<LogDiagnosticsEventDto> events,
        int limit,
        String status
    ) {
        List<LogDiagnosticsIncidentDto> incidents = buildIncidents(findings, events, limit, status);
        int totalMatched = (int) buildIncidents(findings, events, 500, status).size();
        return new LogDiagnosticsIncidentsResponseDto(totalMatched, incidents);
    }

    public LogDiagnosticsIncidentDetailDto getIncidentDetail(
        String incidentId,
        List<LogDiagnosticsFindingDto> findings,
        List<LogDiagnosticsEventDto> events,
        int timelineLimit
    ) {
        List<LogDiagnosticsIncidentDto> incidents = buildIncidents(findings, events, 500, null);
        LogDiagnosticsIncidentDto incident = incidents.stream()
            .filter(candidate -> Objects.equals(candidate.incidentId(), incidentId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));

        IncidentDescriptor descriptor = new IncidentDescriptor(
            incident.incidentKey(),
            incident.title(),
            incident.summary(),
            incident.recommendation(),
            incident.suspectedCause()
        );

        List<LogDiagnosticsFindingDto> relatedFindings = findings.stream()
            .filter(finding -> Objects.equals(describeIncident(finding).incidentKey(), incident.incidentKey()))
            .toList();

        List<LogDiagnosticsEventDto> timeline = events.stream()
            .filter(event -> matchesIncident(event, incident, descriptor))
            .sorted(Comparator.comparing(LogDiagnosticsEventDto::timestamp).reversed())
            .limit(Math.max(1, Math.min(timelineLimit, 200)))
            .toList();

        return new LogDiagnosticsIncidentDetailDto(incident, relatedFindings, timeline);
    }

    public LogDiagnosticsIncidentDto updateStatus(
        String incidentId,
        String status,
        List<LogDiagnosticsFindingDto> findings,
        List<LogDiagnosticsEventDto> events
    ) {
        String normalizedStatus = normalizeStatus(status);
        incidentStatuses.put(incidentId, normalizedStatus);
        return buildIncidents(findings, events, 500, null).stream()
            .filter(incident -> Objects.equals(incident.incidentId(), incidentId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));
    }

    private IncidentDescriptor describeIncident(LogDiagnosticsFindingDto finding) {
        return switch (finding.type()) {
            case "DB_CONNECTION_TIMEOUT", "DB_POOL_PRESSURE" -> new IncidentDescriptor(
                "DATABASE_STABILITY|" + safe(finding.machineId()),
                "Database stability incident",
                "Database pool pressure or JDBC acquisition failures were detected.",
                "Inspect long transactions, expensive file operations inside transactions, and Hikari pool saturation.",
                "Database connection pool saturation or blocked transactions"
            );
            case "HTTP_REQUEST_FAILURE" -> new IncidentDescriptor(
                "HTTP_ENDPOINT_FAILURE|" + safe(finding.path()),
                "Endpoint failure incident",
                "One endpoint is failing repeatedly inside the selected window.",
                "Review the request timeline and related backing service failures for this endpoint.",
                "Repeated request failures against one endpoint"
            );
            case "CIRCUIT_BREAKER_ACTIVITY" -> new IncidentDescriptor(
                "CIRCUIT_BREAKER|" + safe(finding.subsystem()),
                "Circuit breaker instability",
                "Circuit breaker resets or trips indicate an unstable upstream dependency.",
                "Check upstream availability, retries, and timeout bursts in the same subsystem.",
                "Upstream instability triggered protective circuit-breaker behavior"
            );
            case "FILE_SYNC_RETRY_ACTIVITY" -> new IncidentDescriptor(
                "FILE_SYNC_RETRY|" + safe(finding.machineId()),
                "File sync retry incident",
                "File synchronization required retries or recovery work.",
                "Inspect file queue growth, upload/download failures, and network availability.",
                "File transport instability or queue recovery activity"
            );
            default -> new IncidentDescriptor(
                "SYNC_DEGRADED|" + safe(finding.subsystem()) + "|" + safe(finding.machineId()),
                "Sync degradation incident",
                "Warnings or errors accumulated in a sync subsystem during the selected window.",
                "Filter by subsystem, sync run, or machine to trace the failure sequence.",
                "Repeated sync warnings or errors in one subsystem"
            );
        };
    }

    private boolean matchesIncident(
        LogDiagnosticsEventDto event,
        LogDiagnosticsIncidentDto incident,
        IncidentDescriptor descriptor
    ) {
        String key = incident.incidentKey();
        String message = lower(event.message());
        if (key.startsWith("DATABASE_STABILITY|")) {
            return same(event.machineId(), incident.machineId())
                && (message.contains("db.pool.pressure")
                || message.contains("connection is not available")
                || message.contains("cannotcreatetransactionexception"));
        }
        if (key.startsWith("HTTP_ENDPOINT_FAILURE|")) {
            return same(event.path(), incident.path()) || same(event.requestId(), incident.requestId());
        }
        if (key.startsWith("CIRCUIT_BREAKER|")) {
            return same(event.subsystem(), incident.subsystem()) && message.contains("circuit_breaker");
        }
        if (key.startsWith("FILE_SYNC_RETRY|")) {
            return same(event.machineId(), incident.machineId())
                && (message.contains("file_sync") || message.contains("scheduled retry"));
        }
        return same(event.subsystem(), incident.subsystem())
            && sameOrGlobal(event.machineId(), incident.machineId())
            && ("WARN".equalsIgnoreCase(event.level()) || "ERROR".equalsIgnoreCase(event.level()));
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "open";
        }
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "open", "acknowledged", "resolved" -> normalized;
            default -> throw new IllegalArgumentException("Unsupported incident status: " + status);
        };
    }

    private boolean matchesStatus(LogDiagnosticsIncidentDto incident, String status) {
        return status == null || status.isBlank() || "all".equalsIgnoreCase(status)
            || incident.status().equalsIgnoreCase(status);
    }

    private int severityRank(String severity) {
        return switch (severity) {
            case "critical" -> 0;
            case "warning" -> 1;
            default -> 2;
        };
    }

    private boolean same(String left, String right) {
        return Objects.equals(safe(left), safe(right));
    }

    private boolean sameOrGlobal(String left, String right) {
        return same(left, right) || "global".equals(safe(right));
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "global" : value;
    }

    private String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private String incidentId(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder("inc-");
            for (int i = 0; i < 8; i++) {
                builder.append(String.format("%02x", bytes[i]));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 not available", exception);
        }
    }

    private record IncidentDescriptor(
        String incidentKey,
        String title,
        String summary,
        String recommendation,
        String suspectedCause
    ) {
    }

    private final class IncidentAccumulator {
        private final IncidentDescriptor descriptor;
        private final List<String> findingTypes = new ArrayList<>();
        private final List<String> requestIds = new ArrayList<>();
        private final List<String> syncRunIds = new ArrayList<>();
        private String severity = "info";
        private String subsystem = "Application";
        private String machineId;
        private String path;
        private int count;
        private Instant firstSeen;
        private Instant lastSeen;

        private IncidentAccumulator(IncidentDescriptor descriptor) {
            this.descriptor = descriptor;
        }

        private void addFinding(LogDiagnosticsFindingDto finding, List<LogDiagnosticsEventDto> events) {
            findingTypes.add(finding.type());
            severity = moreSevere(severity, finding.severity());
            subsystem = finding.subsystem();
            machineId = prefer(machineId, finding.machineId());
            path = prefer(path, finding.path());
            count += finding.count();
            firstSeen = firstSeen == null || finding.firstSeen().isBefore(firstSeen) ? finding.firstSeen() : firstSeen;
            lastSeen = lastSeen == null || finding.lastSeen().isAfter(lastSeen) ? finding.lastSeen() : lastSeen;

            events.stream()
                .filter(event -> matchesFindingContext(event, finding))
                .limit(5)
                .forEach(event -> {
                    addDistinct(requestIds, event.requestId());
                    addDistinct(syncRunIds, event.syncRunId());
                });
        }

        private boolean matchesFindingContext(LogDiagnosticsEventDto event, LogDiagnosticsFindingDto finding) {
            return sameOrGlobal(event.machineId(), finding.machineId())
                && (same(event.path(), finding.path())
                || same(event.subsystem(), finding.subsystem())
                || lower(event.message()).contains(finding.type().toLowerCase(Locale.ROOT)));
        }

        private LogDiagnosticsIncidentDto toDto() {
            String key = descriptor.incidentKey();
            String id = incidentId(key);
            return new LogDiagnosticsIncidentDto(
                id,
                key,
                incidentStatuses.getOrDefault(id, "open"),
                severity,
                subsystem,
                descriptor.title(),
                descriptor.summary(),
                descriptor.recommendation(),
                descriptor.suspectedCause(),
                count,
                firstSeen,
                lastSeen,
                machineId,
                path,
                requestIds.isEmpty() ? null : requestIds.get(0),
                syncRunIds.isEmpty() ? null : syncRunIds.get(0),
                findingTypes.stream().distinct().toList()
            );
        }

        private String prefer(String existing, String candidate) {
            return existing == null || existing.isBlank() ? candidate : existing;
        }

        private void addDistinct(List<String> values, String value) {
            if (value != null && !value.isBlank() && !values.contains(value)) {
                values.add(value);
            }
        }

        private String moreSevere(String current, String candidate) {
            return severityRank(candidate) < severityRank(current) ? candidate : current;
        }
    }
}
