package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class LogDiagnosticsFileService {

    private static final List<String> LOG_FILE_NAMES = List.of(
        "power-plant-alerts.log",
        "power-plant-sync.log",
        "power-plant-security.log",
        "power-plant-logger.log"
    );

    @Value("${logging.diagnostics.directory:./logs}")
    private String logsDirectory;

    private final LogDiagnosticsParserService parserService;
    private final Map<String, CachedLogFile> cache = new ConcurrentHashMap<>();

    public LogDiagnosticsFileService(LogDiagnosticsParserService parserService) {
        this.parserService = parserService;
    }

    public List<String> getSourceFileNames() {
        return LOG_FILE_NAMES;
    }

    public List<LogDiagnosticsEventDto> getAllEvents() {
        List<LogDiagnosticsEventDto> allEvents = new ArrayList<>();
        Path logsDir = Path.of(logsDirectory);

        for (String fileName : LOG_FILE_NAMES) {
            Path filePath = logsDir.resolve(fileName);
            allEvents.addAll(getEventsForFile(fileName, filePath));
        }

        return allEvents;
    }

    private List<LogDiagnosticsEventDto> getEventsForFile(String fileName, Path filePath) {
        if (!Files.exists(filePath)) {
            cache.remove(fileName);
            return Collections.emptyList();
        }

        try {
            long lastModified = Files.getLastModifiedTime(filePath).toMillis();
            long size = Files.size(filePath);

            CachedLogFile cached = cache.get(fileName);
            if (cached != null && cached.lastModified == lastModified && cached.size == size) {
                return cached.events;
            }

            List<String> lines = Files.readAllLines(filePath, StandardCharsets.UTF_8);
            List<LogDiagnosticsEventDto> events = parserService.parse(fileName, lines);
            cache.put(fileName, new CachedLogFile(lastModified, size, events));
            return events;
        } catch (IOException e) {
            log.warn("log.diagnostics.file.read_failed file={} error={}", fileName, e.getMessage());
            return Collections.emptyList();
        }
    }

    private static final class CachedLogFile {
        final long lastModified;
        final long size;
        final List<LogDiagnosticsEventDto> events;

        CachedLogFile(long lastModified, long size, List<LogDiagnosticsEventDto> events) {
            this.lastModified = lastModified;
            this.size = size;
            this.events = List.copyOf(events);
        }
    }
}
