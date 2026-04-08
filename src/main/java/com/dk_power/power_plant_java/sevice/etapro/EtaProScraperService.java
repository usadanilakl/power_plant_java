package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.repository.etapro.EtaProReadingRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProScraperService {

    private final EtaProPointService etaProPointService;
    private final EtaProReadingRepo etaProReadingRepo;
    private final ObjectMapper objectMapper;

    @Value("${etapro.excel.template.path:${user.dir}/etapro/template.xlsm}")
    private String templatePath;

    @Value("${etapro.output.path:${user.dir}/etapro/output}")
    private String outputPath;

    @Value("${etapro.script.path:${user.dir}/scripts/etapro-scrape.ps1}")
    private String scriptPath;

    @Value("${etapro.signal.path:${user.dir}/etapro/signal}")
    private String signalPath;

    @Value("${etapro.scrape.timeout.seconds:120}")
    private int timeoutSeconds;

    @Value("${etapro.schedule.window.minutes:5}")
    private int scheduleWindowMinutes;

    private Process scraperProcess;
    private final AtomicBoolean scrapeInProgress = new AtomicBoolean(false);
    private final AtomicReference<String> lastStatus = new AtomicReference<>("idle");
    private final AtomicBoolean processRunning = new AtomicBoolean(false);

    public String getStatus() {
        return lastStatus.get();
    }

    public boolean isScraping() {
        return scrapeInProgress.get();
    }

    public boolean isProcessRunning() {
        return processRunning.get() && scraperProcess != null && scraperProcess.isAlive();
    }

    // ── Process lifecycle ──────────────────────────────────────────

    @PostConstruct
    public void init() {
        try {
            Path signalDir = Paths.get(signalPath);
            Files.createDirectories(signalDir);
            Path outputDir = Paths.get(outputPath);
            Files.createDirectories(outputDir);
        } catch (IOException e) {
            log.warn("[EtaPro] Could not create directories: {}", e.getMessage());
        }

        // Startup validation — warn loudly if prerequisites are missing.
        // Service is only instantiated when etapro.enabled=true, so any missing
        // file here is an operator mistake they need to know about immediately.
        validatePrerequisites();
    }

    private void validatePrerequisites() {
        boolean ok = true;

        Path template = Paths.get(templatePath);
        if (!Files.exists(template)) {
            log.warn("[EtaPro] ⚠ Template workbook NOT FOUND at: {}", template.toAbsolutePath());
            log.warn("[EtaPro]   → Create it manually per project/features/etapro-scraper/setup-guide.md (Step 2)");
            ok = false;
        }

        Path script = Paths.get(scriptPath);
        if (!Files.exists(script)) {
            log.warn("[EtaPro] ⚠ PowerShell script NOT FOUND at: {}", script.toAbsolutePath());
            log.warn("[EtaPro]   → Expected: scripts/etapro-scrape.ps1 (should ship with the repo)");
            ok = false;
        }

        String os = System.getProperty("os.name", "").toLowerCase();
        if (!os.contains("win")) {
            log.warn("[EtaPro] ⚠ Not running on Windows (detected: {}) — Excel COM automation is Windows-only",
                    System.getProperty("os.name"));
            ok = false;
        }

        if (ok) {
            log.info("[EtaPro] Prerequisites OK. Template: {}, Script: {}", templatePath, scriptPath);
        } else {
            log.warn("[EtaPro] ⚠ EtaPro is ENABLED but prerequisites are missing. Scrapes will fail until fixed.");
        }
    }

    public synchronized boolean startProcess() {
        if (isProcessRunning()) {
            log.info("[EtaPro] Process already running");
            return true;
        }

        try {
            Path signalDir = Paths.get(signalPath);
            Files.createDirectories(signalDir);

            // Clean stale signal files
            Files.deleteIfExists(signalDir.resolve("request.json"));
            Files.deleteIfExists(signalDir.resolve("response.json"));
            Files.deleteIfExists(signalDir.resolve("shutdown"));

            ProcessBuilder pb = new ProcessBuilder(
                    "powershell", "-ExecutionPolicy", "Bypass",
                    "-File", scriptPath,
                    "-templatePath", templatePath,
                    "-signalDir", signalPath
            );
            pb.redirectErrorStream(true);
            pb.inheritIO(); // pipe output to Java's stdout for logging

            log.info("[EtaPro] Starting persistent scraper process...");
            scraperProcess = pb.start();
            processRunning.set(true);
            lastStatus.set("process started, waiting for Excel to load");

            // Wait a moment for Excel to open, then check it didn't crash immediately
            Thread.sleep(3000);
            if (!scraperProcess.isAlive()) {
                processRunning.set(false);
                lastStatus.set("error: process exited immediately (exit " + scraperProcess.exitValue() + ")");
                log.error("[EtaPro] Process exited immediately with code {}", scraperProcess.exitValue());
                return false;
            }

            lastStatus.set("process running");
            log.info("[EtaPro] Persistent scraper process started (PID check via signal dir)");
            return true;

        } catch (Exception e) {
            processRunning.set(false);
            lastStatus.set("error: " + e.getMessage());
            log.error("[EtaPro] Failed to start scraper process", e);
            return false;
        }
    }

    @PreDestroy
    public synchronized void stopProcess() {
        if (scraperProcess == null) return;

        try {
            // Send graceful shutdown signal
            Path shutdownFile = Paths.get(signalPath, "shutdown");
            Files.writeString(shutdownFile, "shutdown");
            log.info("[EtaPro] Sent shutdown signal, waiting for process to exit...");

            boolean exited = scraperProcess.waitFor(15, TimeUnit.SECONDS);
            if (!exited) {
                log.warn("[EtaPro] Process did not exit gracefully, force-killing");
                scraperProcess.destroyForcibly();
            }
        } catch (Exception e) {
            log.warn("[EtaPro] Error stopping process: {}", e.getMessage());
            if (scraperProcess != null) {
                scraperProcess.destroyForcibly();
            }
        } finally {
            processRunning.set(false);
            scraperProcess = null;
            lastStatus.set("stopped");
        }
    }

    // ── Scraping via signal files ──────────────────────────────────

    @Transactional
    public ScrapeResult scrape(LocalDateTime startTime, LocalDateTime endTime) {
        if (!scrapeInProgress.compareAndSet(false, true)) {
            return new ScrapeResult(false, "Scrape already in progress", null, 0);
        }

        String sessionId = UUID.randomUUID().toString();
        try {
            // Ensure process is running
            if (!isProcessRunning()) {
                lastStatus.set("starting process...");
                if (!startProcess()) {
                    return new ScrapeResult(false, "Could not start scraper process: " + lastStatus.get(), sessionId, 0);
                }
                // Give Excel + EtaPro add-in time to fully load on first start
                Thread.sleep(5000);
            }

            lastStatus.set("preparing");

            // 1. Get active points
            List<EtaProPoint> activePoints = etaProPointService.getActivePoints();
            if (activePoints.isEmpty()) {
                lastStatus.set("error: no active points configured");
                return new ScrapeResult(false, "No active points configured", sessionId, 0);
            }

            String pointIds = String.join(",",
                    activePoints.stream().map(EtaProPoint::getPointId).toList());

            // 2. Build output path
            Path csvOutput = Paths.get(outputPath, "etapro_data.csv");

            // 3. Write request signal
            DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            Map<String, String> request = Map.of(
                    "startDate", startTime.format(fmt),
                    "endDate", endTime.format(fmt),
                    "pointIds", pointIds,
                    "outputPath", csvOutput.toAbsolutePath().toString()
            );

            Path requestFile = Paths.get(signalPath, "request.json");
            Path responseFile = Paths.get(signalPath, "response.json");
            Files.deleteIfExists(responseFile); // clear old response

            lastStatus.set("sending request to scraper");
            log.info("[EtaPro] Scrape request: {} to {}, {} points, session {}",
                    startTime, endTime, activePoints.size(), sessionId);

            Files.writeString(requestFile, objectMapper.writeValueAsString(request));

            // 4. Wait for response signal
            lastStatus.set("waiting for scraper response");
            long deadline = System.currentTimeMillis() + (timeoutSeconds * 1000L);

            while (System.currentTimeMillis() < deadline) {
                if (Files.exists(responseFile)) {
                    break;
                }
                // Check process didn't die
                if (!scraperProcess.isAlive()) {
                    processRunning.set(false);
                    lastStatus.set("error: scraper process died");
                    return new ScrapeResult(false, "Scraper process died unexpectedly", sessionId, 0);
                }
                Thread.sleep(250);
            }

            if (!Files.exists(responseFile)) {
                lastStatus.set("error: scraper timeout");
                return new ScrapeResult(false, "Scraper did not respond within " + timeoutSeconds + "s", sessionId, 0);
            }

            // 5. Read response
            String responseJson = Files.readString(responseFile);
            Files.deleteIfExists(responseFile);
            JsonNode response = objectMapper.readTree(responseJson);

            String status = response.path("status").asText("error");
            String message = response.path("message").asText("");

            if (!"complete".equals(status)) {
                lastStatus.set("error: " + message);
                log.error("[EtaPro] Scraper error: {}", message);
                return new ScrapeResult(false, "Scraper error: " + message, sessionId, 0);
            }

            // 6. Parse CSV output
            lastStatus.set("parsing output");
            if (!Files.exists(csvOutput)) {
                lastStatus.set("error: output file not found");
                return new ScrapeResult(false, "Output CSV not found at " + csvOutput, sessionId, 0);
            }

            List<EtaProReading> readings = parseCsv(csvOutput, sessionId);

            // 7. Deduplicate — skip readings that already exist
            List<EtaProReading> newReadings = new ArrayList<>();
            for (EtaProReading reading : readings) {
                if (reading.getPointId() != null && reading.getReadingTime() != null) {
                    boolean exists = etaProReadingRepo.existsByPointIdAndReadingTime(
                            reading.getPointId(), reading.getReadingTime());
                    if (!exists) {
                        newReadings.add(reading);
                    }
                }
            }

            int skipped = readings.size() - newReadings.size();

            // 8. Save to database
            lastStatus.set("saving " + newReadings.size() + " readings");
            etaProReadingRepo.saveAll(newReadings);

            String msg = newReadings.size() + " readings imported" +
                    (skipped > 0 ? " (" + skipped + " duplicates skipped)" : "");
            lastStatus.set("complete: " + msg);
            log.info("[EtaPro] Scrape complete: {}, session {}", msg, sessionId);
            return new ScrapeResult(true, msg, sessionId, newReadings.size());

        } catch (Exception e) {
            lastStatus.set("error: " + e.getMessage());
            log.error("[EtaPro] Scrape failed", e);
            return new ScrapeResult(false, "Scrape failed: " + e.getMessage(), sessionId, 0);
        } finally {
            scrapeInProgress.set(false);
        }
    }

    /**
     * Scheduled scrape — pulls the last N minutes of data with 1 min overlap.
     * Only runs if etapro.schedule.enabled=true.
     * Uses fixedDelayString so next run starts N seconds after previous finishes.
     */
    @Scheduled(fixedDelayString = "${etapro.schedule.interval.ms:60000}",
            initialDelayString = "${etapro.schedule.initial-delay.ms:30000}")
    public void scheduledScrape() {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusMinutes(scheduleWindowMinutes);
        log.info("[EtaPro] Scheduled scrape: {} to {}", start, end);
        scrape(start, end);
    }

    // ── CSV Parsing ────────────────────────────────────────────────

    List<EtaProReading> parseCsv(Path csvPath, String sessionId) throws IOException {
        List<EtaProReading> readings = new ArrayList<>();
        List<String> lines = Files.readAllLines(csvPath);
        if (lines.isEmpty()) return readings;

        String header = lines.get(0).trim();
        String[] headers = parseCsvLine(header);

        if (headers.length >= 4 && headers[0].equalsIgnoreCase("PointId")) {
            parseFlatFormat(lines, headers, sessionId, readings);
        } else if (headers.length >= 2 && (headers[0].equalsIgnoreCase("Timestamp") || headers[0].equalsIgnoreCase("Time"))) {
            parsePivotFormat(lines, headers, sessionId, readings);
        } else {
            log.warn("[EtaPro] Unknown CSV format. Header: {}", header);
            parseFlatFormat(lines, headers, sessionId, readings);
        }

        return readings;
    }

    private void parseFlatFormat(List<String> lines, String[] headers, String sessionId, List<EtaProReading> readings) {
        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i).trim();
            if (line.isEmpty()) continue;
            String[] cols = parseCsvLine(line);
            if (cols.length < 3) continue;

            try {
                EtaProReading reading = new EtaProReading();
                reading.setPointId(cols[0].trim());
                reading.setReadingTime(parseTimestamp(cols[1].trim()));
                reading.setReadingValue(parseDouble(cols[2].trim()));
                reading.setQuality(cols.length > 3 ? cols[3].trim() : "Good");
                reading.setScrapeSessionId(sessionId);
                readings.add(reading);
            } catch (Exception e) {
                log.warn("[EtaPro] Skipping row {}: {}", i + 1, e.getMessage());
            }
        }
    }

    private void parsePivotFormat(List<String> lines, String[] headers, String sessionId, List<EtaProReading> readings) {
        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i).trim();
            if (line.isEmpty()) continue;
            String[] cols = parseCsvLine(line);
            if (cols.length < 2) continue;

            try {
                LocalDateTime ts = parseTimestamp(cols[0].trim());
                for (int col = 1; col < cols.length && col < headers.length; col++) {
                    String valueStr = cols[col].trim();
                    if (valueStr.isEmpty()) continue;

                    EtaProReading reading = new EtaProReading();
                    reading.setPointId(headers[col].trim());
                    reading.setReadingTime(ts);
                    reading.setReadingValue(parseDouble(valueStr));
                    reading.setQuality("Good");
                    reading.setScrapeSessionId(sessionId);
                    readings.add(reading);
                }
            } catch (Exception e) {
                log.warn("[EtaPro] Skipping row {}: {}", i + 1, e.getMessage());
            }
        }
    }

    private LocalDateTime parseTimestamp(String s) {
        DateTimeFormatter[] formatters = {
                DateTimeFormatter.ISO_LOCAL_DATE_TIME,
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm:ss"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy h:mm:ss a"),
                DateTimeFormatter.ofPattern("M/d/yyyy H:mm:ss"),
                DateTimeFormatter.ofPattern("M/d/yyyy h:mm:ss a")
        };
        for (DateTimeFormatter fmt : formatters) {
            try {
                return LocalDateTime.parse(s, fmt);
            } catch (DateTimeParseException ignored) {}
        }
        throw new DateTimeParseException("Cannot parse timestamp: " + s, s, 0);
    }

    private Double parseDouble(String s) {
        if (s == null || s.isEmpty() || s.equalsIgnoreCase("NaN") || s.equalsIgnoreCase("N/A")) {
            return null;
        }
        return Double.parseDouble(s);
    }

    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }

    public record ScrapeResult(boolean success, String message, String sessionId, int readingCount) {}
}
