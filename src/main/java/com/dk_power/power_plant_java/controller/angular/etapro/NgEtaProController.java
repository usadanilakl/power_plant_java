package com.dk_power.power_plant_java.controller.angular.etapro;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.etapro.EtaProLogEntryDto;
import com.dk_power.power_plant_java.dto.etapro.EtaProPointDto;
import com.dk_power.power_plant_java.dto.etapro.EtaProReadingDto;
import com.dk_power.power_plant_java.dto.etapro.EtaProScrapeJobDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProLogEntry;
import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.sevice.angular.etapro.NgEtaProPointService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProHistoryJobService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProLiveService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProLogEntryService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProLogPullService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProPointImportService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProReadingService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/etapro")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class NgEtaProController {

    private final NgEtaProPointService ngEtaProPointService;
    private final EtaProReadingService etaProReadingService;
    private final EtaProHistoryJobService historyJobService;
    private final EtaProLiveService liveService;
    private final EtaProScraperEngine engine;
    private final EtaProPointImportService pointImportService;
    private final EtaProLogPullService logPullService;
    private final EtaProLogEntryService logEntryService;

    // ── Points CRUD ───────────────────────────────────────────

    @GetMapping("/points")
    public ResponseEntity<NgApiResponse<List<EtaProPointDto>>> getAllPoints() {
        return ResponseEntity.ok(new NgApiResponse<>(ngEtaProPointService.getAllDtos(), "Points retrieved"));
    }

    @GetMapping("/points/{id}")
    public ResponseEntity<NgApiResponse<EtaProPointDto>> getPointById(@PathVariable Long id) {
        return ResponseEntity.ok(new NgApiResponse<>(ngEtaProPointService.getDtoById(id), "Point retrieved"));
    }

    @GetMapping("/points/active")
    public ResponseEntity<NgApiResponse<List<EtaProPointDto>>> getActivePoints() {
        List<EtaProPointDto> points = ngEtaProPointService.getActivePoints()
                .stream().map(ngEtaProPointService::toDto).toList();
        return ResponseEntity.ok(new NgApiResponse<>(points, "Active points retrieved"));
    }

    @PostMapping("/points")
    public ResponseEntity<NgApiResponse<EtaProPointDto>> createPoint(@RequestBody EtaProPointDto dto) {
        EtaProPoint saved = ngEtaProPointService.save(dto);
        return ResponseEntity.ok(new NgApiResponse<>(ngEtaProPointService.toDto(saved), "Point created"));
    }

    @PutMapping("/points")
    public ResponseEntity<NgApiResponse<EtaProPointDto>> updatePoint(@RequestBody EtaProPointDto dto) {
        EtaProPoint existing = ngEtaProPointService.getEntityById(dto.getId());
        if (existing == null) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Point not found"));
        }
        if (dto.getPointId() != null) existing.setPointId(dto.getPointId());
        if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
        if (dto.getUnit() != null) existing.setUnit(dto.getUnit());
        if (dto.getCategory() != null) existing.setCategory(dto.getCategory());
        if (dto.getActive() != null) existing.setActive(dto.getActive());
        EtaProPoint saved = ngEtaProPointService.save(existing);
        return ResponseEntity.ok(new NgApiResponse<>(ngEtaProPointService.toDto(saved), "Point updated"));
    }

    @DeleteMapping("/points/{id}")
    public ResponseEntity<NgApiResponse<String>> deletePoint(@PathVariable Long id) {
        ngEtaProPointService.softDelete(id);
        return ResponseEntity.ok(new NgApiResponse<>("Deleted", "Point soft-deleted"));
    }

    @GetMapping("/points/paginated")
    public ResponseEntity<NgApiResponse<Page<EtaProPointDto>>> getPaginatedPoints(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<EtaProPointDto> result = ngEtaProPointService.getAll(page - 1, pageSize);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Points retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/points/search")
    public ResponseEntity<NgApiResponse<Page<EtaProPointDto>>> searchPoints(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "pointId";
            String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
            Page<EtaProPointDto> searchResults = ngEtaProPointService.complexSearch(
                    criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(searchResults, "Search completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/points/unique-values")
    public ResponseEntity<NgApiResponse<Page<String>>> getUniqueColumnValues(
            @RequestBody SearchCriteria criteria,
            @RequestParam String column,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<String> values = ngEtaProPointService.getFilteredUniqueValues(
                    column, criteria, page - 1, pageSize, true);
            return ResponseEntity.ok(new NgApiResponse<>(values, "Unique values retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Bulk import points from an uploaded .xlsx, .xlsm, or .csv file.
     * Existing points (matched by pointId) are skipped; new ones are added with active=true.
     * Safe to re-run: re-uploading the same file is a no-op except for any new rows.
     */
    @PostMapping("/points/import")
    public ResponseEntity<NgApiResponse<EtaProPointImportService.ImportResult>> importPoints(
            @RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "No file provided"));
        }
        try (var stream = file.getInputStream()) {
            EtaProPointImportService.ImportResult result =
                    pointImportService.importFromUpload(file.getOriginalFilename(), stream);
            String msg = String.format("Added %d, skipped %d existing, %d errors",
                    result.added(), result.skipped(), result.errorCount());
            return ResponseEntity.ok(new NgApiResponse<>(result, msg));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed to read file: " + e.getMessage()));
        }
    }

    // ── History jobs ──────────────────────────────────────────

    public record HistoryJobRequest(List<String> pointIds, LocalDateTime rangeStart, LocalDateTime rangeEnd) {}

    @PostMapping("/jobs")
    public ResponseEntity<NgApiResponse<EtaProScrapeJobDto>> submitJob(@RequestBody HistoryJobRequest req) {
        try {
            EtaProScrapeJob job = historyJobService.submitJob(req.pointIds(), req.rangeStart(), req.rangeEnd());
            return ResponseEntity.ok(new NgApiResponse<>(toDto(job), "History job submitted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/jobs")
    public ResponseEntity<NgApiResponse<Page<EtaProScrapeJobDto>>> listJobs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        Page<EtaProScrapeJobDto> result = historyJobService.listRecent(page, pageSize).map(this::toDto);
        return ResponseEntity.ok(new NgApiResponse<>(result, "Jobs retrieved"));
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<NgApiResponse<EtaProScrapeJobDto>> getJob(@PathVariable Long id) {
        return historyJobService.getById(id)
                .map(j -> ResponseEntity.ok(new NgApiResponse<>(toDto(j), "Job retrieved")))
                .orElseGet(() -> ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Job not found")));
    }

    @DeleteMapping("/jobs/{id}")
    public ResponseEntity<NgApiResponse<String>> cancelJob(@PathVariable Long id) {
        historyJobService.cancelJob(id);
        return ResponseEntity.ok(new NgApiResponse<>("Cancelled", "Job cancellation requested"));
    }

    // ── Live mode ─────────────────────────────────────────────

    public record LiveStartRequest(List<String> pointIds) {}

    @PostMapping("/live/start")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> startLive(@RequestBody LiveStartRequest req) {
        try {
            liveService.start(req.pointIds());
            // Cancel any deferred teardown from a just-prior live/stop so the worker doesn't
            // kill the process we're about to use.
            engine.cancelStopRequest();
            return ResponseEntity.ok(new NgApiResponse<>(liveStatusMap(), "Live subscription started"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/live/stop")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> stopLive() {
        liveService.stop();
        // Ask the worker thread to tear down Excel when idle. Non-blocking: unlike a direct
        // stopProcess() call, this never waits behind an in-flight scrape on the request thread.
        engine.requestStop();
        return ResponseEntity.ok(new NgApiResponse<>(liveStatusMap(), "Live subscription stopped"));
    }

    @GetMapping("/live/status")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getLiveStatus() {
        return ResponseEntity.ok(new NgApiResponse<>(liveStatusMap(), "Live status retrieved"));
    }

    private Map<String, Object> liveStatusMap() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("active", liveService.isActive());
        EtaProLiveService.LiveSubscription snap = liveService.snapshot();
        if (snap != null) {
            status.put("pointIds", snap.pointIds());
            status.put("startedAt", snap.startedAt());
            status.put("lastCycleAt", snap.lastCycleAt());
            status.put("lastCycleCount", snap.lastCycleCount());
        }
        status.put("processRunning", engine.isProcessRunning());
        status.put("engineStatus", engine.getLastStatus());
        return status;
    }

    // ── Readings ──────────────────────────────────────────────

    @GetMapping("/readings")
    public ResponseEntity<NgApiResponse<List<EtaProReadingDto>>> getReadings(
            @RequestParam String pointId,
            @RequestParam LocalDateTime startTime,
            @RequestParam LocalDateTime endTime) {
        List<EtaProReadingDto> readings = etaProReadingService
                .getByPointAndTimeRange(pointId, startTime, endTime)
                .stream().map(etaProReadingService::convertToDto).toList();
        return ResponseEntity.ok(new NgApiResponse<>(readings, readings.size() + " readings retrieved"));
    }

    @GetMapping("/readings/latest")
    public ResponseEntity<NgApiResponse<List<EtaProReadingDto>>> getLatestReadings() {
        List<EtaProReadingDto> readings = etaProReadingService.getLatestPerPoint()
                .stream().map(etaProReadingService::convertToDto).toList();
        return ResponseEntity.ok(new NgApiResponse<>(readings, "Latest readings retrieved"));
    }

    // ── EPLog (Event Log) ─────────────────────────────────────

    public record EpLogPullRequest(LocalDateTime rangeStart, LocalDateTime rangeEnd) {}

    /**
     * Manual EPLog pull. With a range body, pulls that explicit window (backfill);
     * with no/empty body, pulls incrementally from the stored watermark.
     */
    /**
     * Queue a manual EPLog pull (async — runs on the worker thread, not this request thread).
     * Returns immediately with the queued status; the client polls {@code /eplog/pull/status}.
     */
    @PostMapping("/eplog/pull")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> pullEpLog(
            @RequestBody(required = false) EpLogPullRequest req) {
        try {
            LocalDateTime start = req != null ? req.rangeStart() : null;
            LocalDateTime end = req != null ? req.rangeEnd() : null;
            EtaProLogPullService.PullStatus st = logPullService.requestPull(start, end);
            return ResponseEntity.ok(new NgApiResponse<>(pullStatusMap(st),
                    "EPLog pull " + st.state().name().toLowerCase()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/eplog/pull/status")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getEpLogPullStatus() {
        return ResponseEntity.ok(new NgApiResponse<>(pullStatusMap(logPullService.status()), "EPLog pull status"));
    }

    private Map<String, Object> pullStatusMap(EtaProLogPullService.PullStatus st) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("requestId", st.requestId());
        m.put("state", st.state().name());
        m.put("rangeStart", st.rangeStart());
        m.put("rangeEnd", st.rangeEnd());
        m.put("requestedAt", st.requestedAt());
        m.put("completedAt", st.completedAt());
        m.put("imported", st.imported());
        m.put("scraped", st.scraped());
        m.put("message", st.message());
        return m;
    }

    @GetMapping("/eplog")
    public ResponseEntity<NgApiResponse<Page<EtaProLogEntryDto>>> getEpLog(
            @RequestParam(required = false) LocalDateTime startTime,
            @RequestParam(required = false) LocalDateTime endTime,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        Page<EtaProLogEntry> result = (startTime != null && endTime != null)
                ? logEntryService.getByTimeRangePaginated(startTime, endTime, page, pageSize)
                : logEntryService.getRecentPaginated(page, pageSize);
        Page<EtaProLogEntryDto> dtos = result.map(logEntryService::convertToDto);
        return ResponseEntity.ok(new NgApiResponse<>(dtos, dtos.getTotalElements() + " log entries"));
    }

    // ── DTO mapping ───────────────────────────────────────────

    private EtaProScrapeJobDto toDto(EtaProScrapeJob job) {
        EtaProScrapeJobDto dto = new EtaProScrapeJobDto();
        dto.setId(job.getId());
        dto.setMode(job.getMode() == null ? null : job.getMode().name());
        dto.setStatus(job.getStatus() == null ? null : job.getStatus().name());
        dto.setRangeStart(job.getRangeStart());
        dto.setRangeEnd(job.getRangeEnd());
        dto.setPointIds(job.getPointIds());
        dto.setBatchesTotal(job.getBatchesTotal());
        dto.setBatchesCompleted(job.getBatchesCompleted());
        dto.setReadingsImported(job.getReadingsImported());
        dto.setStartedAt(job.getStartedAt());
        dto.setCompletedAt(job.getCompletedAt());
        dto.setErrorMessage(job.getErrorMessage());
        dto.setDateCreated(job.getDateCreated());
        dto.setDateModified(job.getDateModified());
        return dto;
    }
}
