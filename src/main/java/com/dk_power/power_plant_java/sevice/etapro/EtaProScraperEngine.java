package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProLogEntry;
import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.repository.etapro.EtaProLogEntryRepo;
import com.dk_power.power_plant_java.repository.etapro.EtaProReadingRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Low-level primitive that executes a single scrape batch against the EtaPro Excel add-in.
 *
 * <p>A "batch" = a request for up to 20 points over a bounded time range, processed
 * via the persistent PowerShell scraper through signal files.
 *
 * <p>This class is intentionally dumb:
 * <ul>
 *   <li>Manages PowerShell process lifecycle (start/stop/health)</li>
 *   <li>Serializes requests to {@code signal/request.json}</li>
 *   <li>Waits for {@code signal/response.json}</li>
 *   <li>Parses resulting CSV (pivot or flat format)</li>
 *   <li>Deduplicates + saves to {@code eta_pro_reading}</li>
 * </ul>
 *
 * <p>It knows nothing about jobs, schedules, live subscriptions, or batching policy.
 * Higher layers ({@link EtaProScrapeWorker}) orchestrate.
 *
 * <p>Thread-safety: the public {@link #executeBatch} method is {@code synchronized}
 * because the underlying PowerShell process can only handle one request at a time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProScraperEngine {

    /**
     * Max points per history batch — matches the 20 slots in the history template
     * (pivot-layout Data sheet with array formulas B1:U1).
     */
    public static final int MAX_POINTS_PER_HISTORY_BATCH = 20;

    /**
     * Max points per live batch — matches the 100 slots in the live template
     * (column-layout Data sheet with GetEPCurrent formulas in rows 1-100).
     */
    public static final int MAX_POINTS_PER_LIVE_BATCH = 100;

    private final EtaProReadingRepo etaProReadingRepo;
    private final EtaProLogEntryRepo etaProLogEntryRepo;
    private final ObjectMapper objectMapper;

    @Value("${etapro.live.template.path:${user.dir}/etapro/template-live.xlsx}")
    private String liveTemplatePath;

    @Value("${etapro.history.template.path:${user.dir}/etapro/template-history.xlsx}")
    private String historyTemplatePath;

    @Value("${etapro.eplog.template.path:${user.dir}/etapro/template-eplog.xlsx}")
    private String eplogTemplatePath;

    @Value("${etapro.output.path:${user.dir}/etapro/output}")
    private String outputPath;

    @Value("${etapro.script.path:${user.dir}/scripts/etapro-scrape.ps1}")
    private String scriptPath;

    @Value("${etapro.signal.path:${user.dir}/etapro/signal}")
    private String signalPath;

    @Value("${etapro.scrape.timeout.seconds:120}")
    private int timeoutSeconds;

    private Process scraperProcess;
    private final AtomicBoolean processRunning = new AtomicBoolean(false);
    private final AtomicReference<String> lastStatus = new AtomicReference<>("idle");
    private final AtomicReference<LocalDateTime> lastScrapeAt = new AtomicReference<>(null);
    // Deferred teardown flag: request threads (e.g. live/stop) set this instead of calling the
    // synchronized stopProcess() directly, so they never block behind an in-flight scrape. The
    // worker thread consumes it when idle (see EtaProScrapeWorker).
    private final AtomicBoolean stopRequested = new AtomicBoolean(false);

    // ── Accessors ─────────────────────────────────────────────

    /** Non-blocking: ask the worker thread to tear down the Excel/PowerShell process when idle. */
    public void requestStop() {
        stopRequested.set(true);
    }

    /** Worker-only: atomically claim a pending stop request. */
    public boolean consumeStopRequest() {
        return stopRequested.compareAndSet(true, false);
    }

    /** Cancel a pending stop request (e.g. live restarted before the worker tore down). */
    public void cancelStopRequest() {
        stopRequested.set(false);
    }


    public String getLastStatus() {
        return lastStatus.get();
    }

    public LocalDateTime getLastScrapeAt() {
        return lastScrapeAt.get();
    }

    public boolean isProcessRunning() {
        return processRunning.get() && scraperProcess != null && scraperProcess.isAlive();
    }

    // ── Lifecycle ─────────────────────────────────────────────

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(signalPath));
            Files.createDirectories(Paths.get(outputPath));
        } catch (IOException e) {
            log.warn("[EtaPro] Could not create directories: {}", e.getMessage());
        }
        validatePrerequisites();
    }

    private void validatePrerequisites() {
        boolean ok = true;

        Path live = Paths.get(liveTemplatePath);
        if (!Files.exists(live)) {
            log.warn("[EtaPro] \u26a0 Live template NOT FOUND at: {}", live.toAbsolutePath());
            ok = false;
        }

        Path history = Paths.get(historyTemplatePath);
        if (!Files.exists(history)) {
            log.warn("[EtaPro] \u26a0 History template NOT FOUND at: {}", history.toAbsolutePath());
            ok = false;
        }

        // EPLog (Operator Log) is optional \u2014 warn but don't fail prerequisites for it.
        boolean eplogPresent = Files.exists(Paths.get(eplogTemplatePath));
        if (!eplogPresent) {
            log.warn("[EtaPro] \u26a0 EPLog template NOT FOUND at: {} (Operator Log disabled until provided)",
                    Paths.get(eplogTemplatePath).toAbsolutePath());
        }

        Path script = Paths.get(scriptPath);
        if (!Files.exists(script)) {
            log.warn("[EtaPro] \u26a0 PowerShell script NOT FOUND at: {}", script.toAbsolutePath());
            ok = false;
        }

        String os = System.getProperty("os.name", "").toLowerCase();
        if (!os.contains("win")) {
            log.warn("[EtaPro] \u26a0 Not running on Windows (detected: {}) — COM automation is Windows-only",
                    System.getProperty("os.name"));
            ok = false;
        }

        if (ok) {
            log.info("[EtaPro] Prerequisites OK. Live: {}, History: {}, EPLog: {}",
                    liveTemplatePath, historyTemplatePath, eplogPresent ? eplogTemplatePath : "(not provided)");
        } else {
            log.warn("[EtaPro] \u26a0 EtaPro is ENABLED but prerequisites are missing. Scrapes will fail until fixed.");
        }
    }

    public synchronized boolean startProcess() {
        if (isProcessRunning()) return true;

        try {
            Path signalDir = Paths.get(signalPath);
            Files.createDirectories(signalDir);
            Files.deleteIfExists(signalDir.resolve("request.json"));
            Files.deleteIfExists(signalDir.resolve("response.json"));
            Files.deleteIfExists(signalDir.resolve("shutdown"));

            ProcessBuilder pb = new ProcessBuilder(
                    "powershell", "-ExecutionPolicy", "Bypass",
                    "-File", scriptPath,
                    "-liveTemplatePath", liveTemplatePath,
                    "-historyTemplatePath", historyTemplatePath,
                    "-signalDir", signalPath,
                    "-eplogTemplatePath", eplogTemplatePath
            );
            pb.redirectErrorStream(true);
            pb.inheritIO();

            log.info("[EtaPro] Starting persistent scraper process...");
            scraperProcess = pb.start();
            processRunning.set(true);
            lastStatus.set("process started, loading Excel");

            // Interactive launch takes longer — Excel starts, loads add-ins,
            // connects to historian, then the script attaches via GetActiveObject.
            Thread.sleep(10000);
            if (!scraperProcess.isAlive()) {
                processRunning.set(false);
                lastStatus.set("error: process exited immediately (exit " + scraperProcess.exitValue() + ")");
                return false;
            }

            lastStatus.set("process running");
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
        try {
            // 1. Try graceful shutdown via signal file
            if (scraperProcess != null && scraperProcess.isAlive()) {
                try {
                    Files.writeString(Paths.get(signalPath, "shutdown"), "shutdown");
                    boolean exited = scraperProcess.waitFor(10, TimeUnit.SECONDS);
                    if (!exited) {
                        log.warn("[EtaPro] Graceful shutdown timed out, force-killing PowerShell");
                        scraperProcess.destroyForcibly();
                    }
                } catch (Exception e) {
                    log.warn("[EtaPro] Error during graceful shutdown: {}", e.getMessage());
                    scraperProcess.destroyForcibly();
                }
            }
        } finally {
            scraperProcess = null;
            processRunning.set(false);
        }

        // 2. Kill any orphaned Excel process that the script left behind.
        //    This is the safety net — if PowerShell crashed without running its
        //    finally{} block, Excel stays alive invisible and locks the template files.
        killOrphanedExcel();
        lastStatus.set("stopped");
    }

    /**
     * Detect COM errors that indicate Excel is dead and cannot recover without a restart.
     */
    private boolean isComFatalError(String message) {
        if (message == null) return false;
        return message.contains("RPC_E_DISCONNECTED")
                || message.contains("RPC_E_CALL_REJECTED")
                || message.contains("0x800706BA")  // RPC server unavailable
                || message.contains("0x80010108")  // object disconnected
                || message.contains("0x80010001")  // call rejected
                || message.contains("DISP_E_BADINDEX");
    }

    /**
     * Kill any invisible Excel process. Called on shutdown and on COM errors
     * (RPC_E_DISCONNECTED, RPC server unavailable) to clean up before restart.
     */
    private void killOrphanedExcel() {
        try {
            ProcessBuilder kill = new ProcessBuilder(
                    "taskkill", "/F", "/IM", "EXCEL.EXE");
            kill.redirectErrorStream(true);
            Process p = kill.start();
            p.waitFor(5, TimeUnit.SECONDS);
            // Ignore exit code — 128 means "no such process" which is fine
            log.info("[EtaPro] taskkill EXCEL.EXE completed (exit {})", p.exitValue());
        } catch (Exception e) {
            log.warn("[EtaPro] Failed to kill Excel: {}", e.getMessage());
        }
    }

    // ── Core primitive ────────────────────────────────────────

    /**
     * Template selector — matches the {@code template} field sent to the PowerShell script.
     */
    public enum Template {
        LIVE("live"),
        HISTORY("history"),
        EPLOG("eplog");

        private final String signalName;
        Template(String signalName) { this.signalName = signalName; }
        public String signalName() { return signalName; }
    }

    public static class BatchResult {
        public final boolean success;
        public final String message;
        public final int scrapedCount;
        public final int importedCount;
        public final String sessionId;

        public BatchResult(boolean success, String message, int scrapedCount, int importedCount, String sessionId) {
            this.success = success;
            this.message = message;
            this.scrapedCount = scrapedCount;
            this.importedCount = importedCount;
            this.sessionId = sessionId;
        }

        public static BatchResult failure(String message, String sessionId) {
            return new BatchResult(false, message, 0, 0, sessionId);
        }
    }

    /**
     * Execute a single scrape batch. Auto-starts the PowerShell process if needed.
     *
     * @param template which Excel template to use
     * @param pointIds up to {@link #MAX_POINTS_PER_HISTORY_BATCH} (history) or
     *                 {@link #MAX_POINTS_PER_LIVE_BATCH} (live) point IDs
     * @param start    inclusive window start
     * @param end      inclusive window end
     */
    // NOTE: intentionally NOT @Transactional. This method blocks on the external PowerShell/Excel
    // process for up to timeoutSeconds; holding a JDBC connection + open transaction across that wait
    // would pin a Hikari connection (and an H2 write lock) for minutes. The only DB work is the dedup
    // existence checks + saveAll at the end, and repository saveAll is transactional on its own.
    public synchronized BatchResult executeBatch(Template template, List<String> pointIds,
                                                 LocalDateTime start, LocalDateTime end) {
        String sessionId = UUID.randomUUID().toString();

        // EPLOG pulls carry no points; live/history require at least one.
        if (template != Template.EPLOG && (pointIds == null || pointIds.isEmpty())) {
            return BatchResult.failure("No points in batch", sessionId);
        }
        if (template != Template.EPLOG) {
            int cap = (template == Template.LIVE) ? MAX_POINTS_PER_LIVE_BATCH : MAX_POINTS_PER_HISTORY_BATCH;
            if (pointIds.size() > cap) {
                return BatchResult.failure("Batch exceeds max " + cap + " points for " + template, sessionId);
            }
        }

        try {
            if (!isProcessRunning()) {
                if (!startProcess()) {
                    return BatchResult.failure("Could not start scraper process: " + lastStatus.get(), sessionId);
                }
                Thread.sleep(15000); // first-load grace: interactive Excel + add-in init
            }

            lastStatus.set("sending request (" + template.signalName() + ", " + pointIds.size() + " points)");

            DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("template", template.signalName());
            request.put("startDate", start.format(fmt));
            request.put("endDate", end.format(fmt));
            request.put("pointIds", pointIds == null ? "" : String.join(",", pointIds));
            Path csvOutput = Paths.get(outputPath, "etapro_data.csv");
            request.put("outputPath", csvOutput.toAbsolutePath().toString());

            Path requestFile = Paths.get(signalPath, "request.json");
            Path responseFile = Paths.get(signalPath, "response.json");
            Files.deleteIfExists(responseFile);

            Files.writeString(requestFile, objectMapper.writeValueAsString(request));

            // Wait for response
            long deadline = System.currentTimeMillis() + (timeoutSeconds * 1000L);
            while (System.currentTimeMillis() < deadline) {
                if (Files.exists(responseFile)) break;
                if (!scraperProcess.isAlive()) {
                    processRunning.set(false);
                    return BatchResult.failure("Scraper process died unexpectedly", sessionId);
                }
                Thread.sleep(200);
            }

            if (!Files.exists(responseFile)) {
                return BatchResult.failure("Scraper timeout after " + timeoutSeconds + "s", sessionId);
            }

            String responseJson = Files.readString(responseFile);
            Files.deleteIfExists(responseFile);
            // Strip UTF-8 BOM if present — PowerShell 5.1 emits it even with
            // [System.Text.UTF8Encoding]::new($false) in some environments.
            if (responseJson.length() > 0 && responseJson.charAt(0) == '\uFEFF') {
                responseJson = responseJson.substring(1);
            }
            JsonNode response = objectMapper.readTree(responseJson);

            String status = response.path("status").asText("error");
            String message = response.path("message").asText("");

            if (!"complete".equals(status)) {
                // Detect fatal COM errors that mean Excel is dead — kill and restart
                if (isComFatalError(message)) {
                    log.warn("[EtaPro] COM fatal error detected, killing process for restart: {}", message);
                    stopProcess();
                    // Give OS time to release file locks
                    Thread.sleep(2000);
                }
                return BatchResult.failure("Scraper error: " + message, sessionId);
            }

            if (!Files.exists(csvOutput)) {
                return BatchResult.failure("Output CSV not found at " + csvOutput, sessionId);
            }

            // EPLog (Event Log) has its own text schema + dedup — handle separately.
            if (template == Template.EPLOG) {
                return importEpLog(csvOutput, sessionId);
            }

            List<EtaProReading> readings = parseCsv(csvOutput, sessionId);

            // Dedup
            List<EtaProReading> newReadings = new ArrayList<>();
            for (EtaProReading r : readings) {
                if (r.getPointId() != null && r.getReadingTime() != null
                        && !etaProReadingRepo.existsByPointIdAndReadingTime(r.getPointId(), r.getReadingTime())) {
                    newReadings.add(r);
                }
            }

            etaProReadingRepo.saveAll(newReadings);

            lastScrapeAt.set(LocalDateTime.now());
            String msg = newReadings.size() + "/" + readings.size() + " imported";
            lastStatus.set(msg);
            log.debug("[EtaPro] Batch {} ({}, {} pts): {}", sessionId, template.signalName(), pointIds.size(), msg);

            return new BatchResult(true, msg, readings.size(), newReadings.size(), sessionId);

        } catch (Exception e) {
            lastStatus.set("error: " + e.getMessage());
            log.error("[EtaPro] Batch failed", e);
            return BatchResult.failure("Batch failed: " + e.getMessage(), sessionId);
        }
    }

    // ── CSV Parsing ───────────────────────────────────────────

    List<EtaProReading> parseCsv(Path csvPath, String sessionId) throws IOException {
        List<EtaProReading> readings = new ArrayList<>();
        List<String> lines = Files.readAllLines(csvPath);
        if (lines.isEmpty()) return readings;

        // Strip UTF-8 BOM from first line if present (PowerShell 5.1 issue)
        String firstLine = lines.get(0);
        if (firstLine.length() > 0 && firstLine.charAt(0) == '\uFEFF') {
            lines.set(0, firstLine.substring(1));
        }

        String[] headers = parseCsvLine(lines.get(0).trim());

        if (headers.length >= 4 && headers[0].equalsIgnoreCase("PointId")) {
            parseFlatFormat(lines, sessionId, readings);
        } else if (headers.length >= 2 && (headers[0].equalsIgnoreCase("Timestamp") || headers[0].equalsIgnoreCase("Time"))) {
            parsePivotFormat(lines, headers, sessionId, readings);
        } else {
            log.warn("[EtaPro] Unknown CSV format. Header: {}", String.join(",", headers));
            parseFlatFormat(lines, sessionId, readings);
        }

        return readings;
    }

    private void parseFlatFormat(List<String> lines, String sessionId, List<EtaProReading> readings) {
        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i).trim();
            if (line.isEmpty()) continue;
            String[] cols = parseCsvLine(line);
            if (cols.length < 3) continue;
            try {
                EtaProReading r = new EtaProReading();
                r.setPointId(cols[0].trim());
                r.setReadingTime(parseTimestamp(cols[1].trim()));
                r.setReadingValue(parseDouble(cols[2].trim()));
                r.setQuality(cols.length > 3 ? cols[3].trim() : "Good");
                r.setScrapeSessionId(sessionId);
                readings.add(r);
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
                    String pointId = headers[col].trim();
                    if (pointId.isEmpty()) continue;
                    EtaProReading r = new EtaProReading();
                    r.setPointId(pointId);
                    r.setReadingTime(ts);
                    r.setReadingValue(parseDouble(valueStr));
                    r.setQuality("Good");
                    r.setScrapeSessionId(sessionId);
                    readings.add(r);
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
            try { return LocalDateTime.parse(s, fmt); } catch (DateTimeParseException ignored) {}
        }
        throw new DateTimeParseException("Cannot parse timestamp: " + s, s, 0);
    }

    private Double parseDouble(String s) {
        if (s == null || s.isEmpty() || s.equalsIgnoreCase("NaN") || s.equalsIgnoreCase("N/A")) return null;
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

    // ── EPLog (Event Log) import ───────────────────────────────

    private BatchResult importEpLog(Path csvOutput, String sessionId) throws IOException {
        List<EtaProLogEntry> entries = parseEpLogCsv(csvOutput, sessionId);

        Set<String> seen = new HashSet<>();
        List<EtaProLogEntry> fresh = new ArrayList<>();
        for (EtaProLogEntry e : entries) {
            String key = e.getDedupKey();
            if (key == null) continue;
            if (!seen.add(key)) continue;                          // duplicate within this batch
            if (etaProLogEntryRepo.existsByDedupKey(key)) continue; // already stored
            fresh.add(e);
        }
        etaProLogEntryRepo.saveAll(fresh);

        lastScrapeAt.set(LocalDateTime.now());
        String msg = fresh.size() + "/" + entries.size() + " log entries imported";
        lastStatus.set(msg);
        log.debug("[EtaPro] EPLog batch {}: {}", sessionId, msg);
        return new BatchResult(true, msg, entries.size(), fresh.size(), sessionId);
    }

    List<EtaProLogEntry> parseEpLogCsv(Path csvPath, String sessionId) throws IOException {
        List<EtaProLogEntry> out = new ArrayList<>();
        List<String> lines = Files.readAllLines(csvPath);
        if (lines.isEmpty()) return out;

        // Strip UTF-8 BOM from first line if present (PowerShell 5.1 issue)
        String firstLine = lines.get(0);
        if (!firstLine.isEmpty() && firstLine.charAt(0) == '﻿') {
            lines.set(0, firstLine.substring(1));
        }

        // Map column name -> index (robust to column reordering in the template)
        String[] headers = parseCsvLine(lines.get(0).trim());
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            idx.put(headers[i].trim().toLowerCase(), i);
        }

        // Guard against template/export drift: if the key columns didn't resolve, EVERY row would
        // hit the blank-row skip below and the batch would falsely report success with 0 imported
        // (and the watermark would never advance, re-dropping the window forever). Fail loudly instead.
        if (!idx.containsKey("description") || !idx.containsKey("create time")) {
            throw new IOException("EPLog CSV missing expected headers (need 'Description' and 'Create Time'); got: "
                    + String.join(", ", headers));
        }

        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line == null || line.trim().isEmpty()) continue;
            String[] cols = parseCsvLine(line);
            try {
                EtaProLogEntry e = new EtaProLogEntry();
                e.setDescription(getField(cols, idx, "description"));
                e.setArea(getField(cols, idx, "area"));
                e.setLocation(getField(cols, idx, "location"));
                e.setCreatedByName(getField(cols, idx, "created by"));
                e.setCreateTime(parseEpLogDateTime(getField(cols, idx, "create time")));
                e.setDeactivatedBy(getField(cols, idx, "deactivated by"));
                e.setDeactivateTime(parseEpLogDateTime(getField(cols, idx, "deactivate time")));
                e.setCrew(getField(cols, idx, "crew"));
                e.setScrapeSessionId(sessionId);

                // Skip fully-blank rows
                if (e.getDescription() == null && e.getCreateTime() == null) continue;

                e.setDedupKey(computeDedupKey(e.getCreateTime(), e.getDescription(), e.getCreatedByName()));
                out.add(e);
            } catch (Exception ex) {
                log.warn("[EtaPro] Skipping EPLog row {}: {}", i + 1, ex.getMessage());
            }
        }
        return out;
    }

    /** Trimmed value for the named header (case-insensitive), or null if missing/blank. */
    private String getField(String[] cols, Map<String, Integer> idx, String header) {
        Integer i = idx.get(header);
        if (i == null || i >= cols.length) return null;
        String v = cols[i].trim();
        return v.isEmpty() ? null : v;
    }

    /**
     * EPLog Create/Deactivate times export as Excel serial numbers (e.g. 46202.3035185185).
     * Convert via the OADate epoch (1899-12-30). Falls back to text date formats if not numeric.
     */
    private LocalDateTime parseEpLogDateTime(String s) {
        if (s == null || s.isEmpty()) return null;
        try {
            double serial = Double.parseDouble(s);
            long wholeDays = (long) Math.floor(serial);
            long seconds = Math.round((serial - wholeDays) * 86400.0);
            return LocalDateTime.of(1899, 12, 30, 0, 0, 0).plusDays(wholeDays).plusSeconds(seconds);
        } catch (NumberFormatException notSerial) {
            try {
                return parseTimestamp(s);
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }
    }

    /** Composite dedup key (no Event ID available): SHA-256 of createTime|description|createdBy. */
    private String computeDedupKey(LocalDateTime createTime, String description, String createdBy) {
        String basis = (createTime == null ? "" : createTime.toString()) + "|"
                + (description == null ? "" : description) + "|"
                + (createdBy == null ? "" : createdBy);
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(basis.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b & 0xff));
            return sb.toString();
        } catch (Exception e) {
            // SHA-256 is always available; defensive fallback only
            return Integer.toHexString(basis.hashCode());
        }
    }
}
