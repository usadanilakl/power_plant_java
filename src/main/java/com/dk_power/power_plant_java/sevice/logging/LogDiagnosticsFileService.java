package com.dk_power.power_plant_java.sevice.logging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    public Map<String, List<String>> readCurrentLogFiles() {
        Map<String, List<String>> files = new LinkedHashMap<>();
        Path logsDir = Path.of(logsDirectory);

        for (String fileName : LOG_FILE_NAMES) {
            Path filePath = logsDir.resolve(fileName);
            if (!Files.exists(filePath)) {
                continue;
            }
            try {
                files.put(fileName, Files.readAllLines(filePath, StandardCharsets.UTF_8));
            } catch (IOException e) {
                log.warn("log.diagnostics.file.read_failed file={} error={}", fileName, e.getMessage());
            }
        }

        return files;
    }
}
