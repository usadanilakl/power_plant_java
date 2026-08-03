package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsProperties;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsBundleRequestDto;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Creates an immediate, sanitized NDJSON support snapshot; nothing is persisted. */
@Service
@Slf4j
public class AiDiagnosticsBundleService {

    private static final int MANIFEST_RESERVE_BYTES = 4096;

    private final AiDiagnosticsProperties properties;
    private final AiDiagnosticsQueryService queryService;
    private final ObjectMapper objectMapper;
    private final String applicationName;

    public AiDiagnosticsBundleService(
        AiDiagnosticsProperties properties,
        AiDiagnosticsQueryService queryService,
        ObjectMapper objectMapper,
        @Value("${spring.application.name:power-plant}") String applicationName
    ) {
        this.properties = properties;
        this.queryService = queryService;
        this.objectMapper = objectMapper;
        this.applicationName = applicationName;
    }

    public AiDiagnosticsBundleResult create(
        String identity,
        AiDiagnosticsBundleRequestDto requested
    ) {
        AiDiagnosticsBundleRequestDto request = requested == null
            ? new AiDiagnosticsBundleRequestDto(null, null, null, null, null, null, null, null, null, null, null)
            : requested;
        AiDiagnosticsProperties.Bundle limits = properties.getBundle();
        int maxEvents = Math.max(1, limits.getMaxEvents());
        int targetEvents = request.limit() == null
            ? maxEvents : Math.max(1, Math.min(request.limit(), maxEvents));
        int maxBytes = Math.max(MANIFEST_RESERVE_BYTES + 1, limits.getMaxBytes());
        int eventBytesBudget = maxBytes - MANIFEST_RESERVE_BYTES;
        int pageSize = Math.max(1, Math.min(limits.getPageSize(),
            Math.max(1, properties.getMaxEventsPerResponse())));

        List<byte[]> eventLines = new ArrayList<>();
        int eventBytes = 0;
        String cursor = null;
        boolean hasMore = true;
        boolean truncated = false;
        Set<String> levels = parseLevels(request.levels());

        while (hasMore && eventLines.size() < targetEvents) {
            int requestedPageSize = Math.min(pageSize, targetEvents - eventLines.size());
            var page = queryService.query(
                identity, request.from(), request.to(), requestedPageSize, cursor, "asc", levels,
                request.text(), request.sourceFile(), request.subsystem(), request.eventCode(),
                request.requestId(), request.syncRunId(), request.machineId());
            truncated |= page.truncated();
            if (page.events().isEmpty()) {
                hasMore = false;
                break;
            }

            boolean byteLimitReached = false;
            for (AiDiagnosticsEventDto event : page.events()) {
                byte[] line = eventLine(event);
                if (eventBytes + line.length > eventBytesBudget) {
                    truncated = true;
                    hasMore = true;
                    byteLimitReached = true;
                    break;
                }
                eventLines.add(line);
                eventBytes += line.length;
                cursor = event.id();
            }
            if (byteLimitReached) {
                break;
            }

            hasMore = page.hasMore();
            if (!hasMore || cursor == null) {
                break;
            }
        }

        if (hasMore) {
            truncated = true;
        }
        String nextCursor = truncated ? cursor : null;
        byte[] manifest = manifestLine(eventLines.size(), truncated, nextCursor);
        ByteArrayOutputStream output = new ByteArrayOutputStream(manifest.length + eventBytes);
        output.writeBytes(manifest);
        eventLines.forEach(output::writeBytes);

        byte[] content = output.toByteArray();
        log.info("audit.ai_diagnostics.bundle identity={} events={} bytes={} truncated={}",
            identity, eventLines.size(), content.length, truncated);
        return new AiDiagnosticsBundleResult(content, eventLines.size(), truncated, nextCursor);
    }

    private byte[] manifestLine(int eventCount, boolean truncated, String nextCursor) {
        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("type", "manifest");
        manifest.put("schemaVersion", 1);
        manifest.put("generatedAt", Instant.now());
        manifest.put("application", applicationName);
        manifest.put("sanitized", true);
        manifest.put("eventCount", eventCount);
        manifest.put("truncated", truncated);
        if (nextCursor != null) {
            manifest.put("nextCursor", nextCursor);
        }
        return jsonLine(manifest);
    }

    private byte[] eventLine(AiDiagnosticsEventDto event) {
        return jsonLine(Map.of("type", "event", "event", event));
    }

    private byte[] jsonLine(Object value) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(value);
            byte[] line = Arrays.copyOf(json, json.length + 1);
            line[line.length - 1] = '\n';
            return line;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize diagnostics support snapshot", e);
        }
    }

    private Set<String> parseLevels(String levels) {
        String effectiveLevels = levels == null || levels.isBlank() ? "WARN,ERROR" : levels;
        int maxLength = Math.max(1, properties.getMaxFilterValueLength());
        if (effectiveLevels.length() > maxLength) {
            throw new IllegalArgumentException("levels exceeds the maximum length of " + maxLength);
        }
        return Arrays.stream(effectiveLevels.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .collect(Collectors.toUnmodifiableSet());
    }
}
