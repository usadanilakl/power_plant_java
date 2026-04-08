package com.dk_power.power_plant_java.controller.angular.etapro;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.etapro.EtaProPointDto;
import com.dk_power.power_plant_java.dto.etapro.EtaProReadingDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.sevice.etapro.EtaProPointService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProReadingService;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/etapro")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class NgEtaProController {

    private final EtaProPointService etaProPointService;
    private final EtaProReadingService etaProReadingService;
    private final EtaProScraperService etaProScraperService;

    // ── Points CRUD ──────────────────────────────────────────────

    @GetMapping("/points")
    public ResponseEntity<NgApiResponse<List<EtaProPointDto>>> getAllPoints() {
        List<EtaProPointDto> points = etaProPointService.getAllDtos();
        return ResponseEntity.ok(new NgApiResponse<>(points, "Points retrieved"));
    }

    @GetMapping("/points/{id}")
    public ResponseEntity<NgApiResponse<EtaProPointDto>> getPointById(@PathVariable Long id) {
        EtaProPointDto dto = etaProPointService.getDtoById(id);
        return ResponseEntity.ok(new NgApiResponse<>(dto, "Point retrieved"));
    }

    @GetMapping("/points/active")
    public ResponseEntity<NgApiResponse<List<EtaProPointDto>>> getActivePoints() {
        List<EtaProPointDto> points = etaProPointService.getActivePoints()
                .stream().map(p -> etaProPointService.convertToDto(p)).toList();
        return ResponseEntity.ok(new NgApiResponse<>(points, "Active points retrieved"));
    }

    @GetMapping("/points/category/{category}")
    public ResponseEntity<NgApiResponse<List<EtaProPointDto>>> getPointsByCategory(@PathVariable String category) {
        List<EtaProPointDto> points = etaProPointService.getByCategory(category)
                .stream().map(p -> etaProPointService.convertToDto(p)).toList();
        return ResponseEntity.ok(new NgApiResponse<>(points, "Points retrieved for category: " + category));
    }

    @PostMapping("/points")
    public ResponseEntity<NgApiResponse<EtaProPointDto>> createPoint(@RequestBody EtaProPointDto dto) {
        EtaProPoint saved = etaProPointService.save(dto);
        return ResponseEntity.ok(new NgApiResponse<>(etaProPointService.convertToDto(saved), "Point created"));
    }

    @PutMapping("/points")
    public ResponseEntity<NgApiResponse<EtaProPointDto>> updatePoint(@RequestBody EtaProPointDto dto) {
        EtaProPoint existing = etaProPointService.getEntityById(dto.getId());
        if (existing == null) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Point not found"));
        }
        if (dto.getPointId() != null) existing.setPointId(dto.getPointId());
        if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
        if (dto.getUnit() != null) existing.setUnit(dto.getUnit());
        if (dto.getCategory() != null) existing.setCategory(dto.getCategory());
        if (dto.getActive() != null) existing.setActive(dto.getActive());
        EtaProPoint saved = etaProPointService.save(existing);
        return ResponseEntity.ok(new NgApiResponse<>(etaProPointService.convertToDto(saved), "Point updated"));
    }

    @DeleteMapping("/points/{id}")
    public ResponseEntity<NgApiResponse<String>> deletePoint(@PathVariable Long id) {
        etaProPointService.softDelete(id);
        return ResponseEntity.ok(new NgApiResponse<>("Deleted", "Point soft-deleted"));
    }

    // ── Process management ─────────────────────────────────────────

    @PostMapping("/process/start")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> startProcess() {
        boolean started = etaProScraperService.startProcess();
        Map<String, Object> result = Map.of(
                "running", etaProScraperService.isProcessRunning(),
                "status", etaProScraperService.getStatus()
        );
        return ResponseEntity.ok(new NgApiResponse<>(result,
                started ? "Scraper process started" : "Failed to start scraper process"));
    }

    @PostMapping("/process/stop")
    public ResponseEntity<NgApiResponse<String>> stopProcess() {
        etaProScraperService.stopProcess();
        return ResponseEntity.ok(new NgApiResponse<>("Stopped", "Scraper process stopped"));
    }

    // ── Scraping ─────────────────────────────────────────────────

    @PostMapping("/scrape")
    public ResponseEntity<NgApiResponse<EtaProScraperService.ScrapeResult>> triggerScrape(
            @RequestParam LocalDateTime startTime,
            @RequestParam LocalDateTime endTime) {
        EtaProScraperService.ScrapeResult result = etaProScraperService.scrape(startTime, endTime);
        String status = result.success() ? "Scrape completed" : "Scrape failed";
        return ResponseEntity.ok(new NgApiResponse<>(result, status));
    }

    @GetMapping("/scrape/status")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getScrapeStatus() {
        Map<String, Object> status = Map.of(
                "processRunning", etaProScraperService.isProcessRunning(),
                "scrapeInProgress", etaProScraperService.isScraping(),
                "lastStatus", etaProScraperService.getStatus()
        );
        return ResponseEntity.ok(new NgApiResponse<>(status, "Scrape status retrieved"));
    }

    // ── Readings ─────────────────────────────────────────────────

    @GetMapping("/readings")
    public ResponseEntity<NgApiResponse<List<EtaProReadingDto>>> getReadings(
            @RequestParam String pointId,
            @RequestParam LocalDateTime startTime,
            @RequestParam LocalDateTime endTime) {
        List<EtaProReadingDto> readings = etaProReadingService
                .getByPointAndTimeRange(pointId, startTime, endTime)
                .stream().map(r -> etaProReadingService.convertToDto(r)).toList();
        return ResponseEntity.ok(new NgApiResponse<>(readings, readings.size() + " readings retrieved"));
    }

    @GetMapping("/readings/latest")
    public ResponseEntity<NgApiResponse<List<EtaProReadingDto>>> getLatestReadings() {
        List<EtaProReadingDto> readings = etaProReadingService.getLatestPerPoint()
                .stream().map(r -> etaProReadingService.convertToDto(r)).toList();
        return ResponseEntity.ok(new NgApiResponse<>(readings, "Latest readings retrieved"));
    }

    @GetMapping("/readings/paginated")
    public ResponseEntity<NgApiResponse<Page<EtaProReadingDto>>> getReadingsPaginated(
            @RequestParam(required = false) String pointId,
            @RequestParam(required = false) LocalDateTime startTime,
            @RequestParam(required = false) LocalDateTime endTime,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        Page<EtaProReadingDto> result;
        if (pointId != null && !pointId.isEmpty()) {
            result = etaProReadingService.getByPointPaginated(pointId, page, pageSize)
                    .map(r -> etaProReadingService.convertToDto(r));
        } else if (startTime != null && endTime != null) {
            result = etaProReadingService.getByTimeRangePaginated(startTime, endTime, page, pageSize)
                    .map(r -> etaProReadingService.convertToDto(r));
        } else {
            // Default: latest readings paginated
            result = etaProReadingService.getByTimeRangePaginated(
                    LocalDateTime.now().minusDays(1), LocalDateTime.now(), page, pageSize)
                    .map(r -> etaProReadingService.convertToDto(r));
        }
        return ResponseEntity.ok(new NgApiResponse<>(result, "Readings retrieved"));
    }

    @GetMapping("/readings/session/{sessionId}")
    public ResponseEntity<NgApiResponse<List<EtaProReadingDto>>> getReadingsBySession(@PathVariable String sessionId) {
        List<EtaProReadingDto> readings = etaProReadingService.getBySessionId(sessionId)
                .stream().map(r -> etaProReadingService.convertToDto(r)).toList();
        return ResponseEntity.ok(new NgApiResponse<>(readings, readings.size() + " readings in session"));
    }
}
