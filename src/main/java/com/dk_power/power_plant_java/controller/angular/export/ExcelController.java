package com.dk_power.power_plant_java.controller.angular.export;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgWorkRequestService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelWriterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/ng/excel")
public class ExcelController {
    private static final Logger log = LoggerFactory.getLogger(ExcelController.class);

    private final ExcelWriterService excelWriterService;
    private final NgLotoPointService lotoPointService;
    private final NgFileService fileService;
    private final NgLotoStandardService lotoStandardService;
    private final NgWorkRequestService workRequestService;
    private final String projectRoot;

    private static final DateTimeFormatter TIMESTAMP_FMT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final long MAX_EXPORT_AGE_MS = 7L * 24 * 60 * 60 * 1000; // 7 days

    public ExcelController(
            ExcelWriterService excelWriterService,
            NgLotoPointService lotoPointService,
            NgFileService fileService,
            NgLotoStandardService lotoStandardService,
            NgWorkRequestService workRequestService,
            @Value("${project.root}") String projectRoot
    ) {
        this.excelWriterService = excelWriterService;
        this.lotoPointService = lotoPointService;
        this.fileService = fileService;
        this.lotoStandardService = lotoStandardService;
        this.workRequestService = workRequestService;
        this.projectRoot = projectRoot;
    }

    private String buildExportPath(String baseName) {
        File exportsDir = new File(projectRoot, "exports");
        if (!exportsDir.exists()) {
            exportsDir.mkdirs();
        }
        cleanOldExports(exportsDir);
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FMT);
        return new File(exportsDir, baseName + "_" + timestamp + ".xlsx").getAbsolutePath();
    }

    private void cleanOldExports(File exportsDir) {
        File[] files = exportsDir.listFiles((dir, name) -> name.endsWith(".xlsx"));
        if (files == null) return;
        long cutoff = System.currentTimeMillis() - MAX_EXPORT_AGE_MS;
        for (File f : files) {
            if (f.lastModified() < cutoff) {
                f.delete();
            }
        }
    }

    // ==================== LOTO POINT ====================

    /**
     * @Transactional(readOnly=true) keeps the Hibernate session open across
     * the whole write so lazy collections on the streamed LotoPoints
     * (equipmentList → mainFile → fileLink, used by writeStandardLotoPointRows
     * / writeLotoPointsToExcelTableWithLinks to build the file-link column)
     * initialise on demand instead of throwing
     * LazyInitializationException. Read-only + no propagation change so
     * this only affects the export path.
     */
    @Transactional(readOnly = true)
    @GetMapping("/loto-point/export-all")
    public ResponseEntity<NgApiResponse<String>> exportLotoPointAll() {
        try {
            List<LotoPoint> all = lotoPointService.getAll();
            excelWriterService.writeLotoPointsToExcelTableWithLinks(buildExportPath("loto_points"), all);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + all.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @Transactional(readOnly = true)
    @PostMapping("/loto-point/export-by-query")
    public ResponseEntity<NgApiResponse<String>> exportLotoPointByQuery(@RequestBody SearchCriteria criteria) {
        try {
            List<LotoPoint> queriedPoints = lotoPointService.getBySearchCriteria(criteria);
            excelWriterService.writeLotoPointsToExcelTableWithLinks(buildExportPath("loto_points_queried"), queriedPoints);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + queriedPoints.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @Transactional(readOnly = true)
    @PostMapping("/loto-point/export-by-ids")
    public ResponseEntity<NgApiResponse<String>> exportLotoPointByIds(@RequestBody List<Long> ids) {
        try {
            List<LotoPoint> selectedPoints = lotoPointService.getByIds(ids);
            excelWriterService.writeLotoPointsToExcelTableWithLinks(buildExportPath("loto_points_selected"), selectedPoints);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + selectedPoints.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    // ==================== FILE ====================

    @GetMapping("/file/export-all")
    public ResponseEntity<NgApiResponse<String>> exportFileAll() {
        try {
            List<FileObject> all = fileService.getAll();
            excelWriterService.writeFilesToExcel(buildExportPath("files"), all);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + all.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/file/export-by-query")
    public ResponseEntity<NgApiResponse<String>> exportFileByQuery(@RequestBody SearchCriteria criteria) {
        try {
            List<FileObject> queriedFiles = fileService.getBySearchCriteria(criteria);
            excelWriterService.writeFilesToExcel(buildExportPath("files_queried"), queriedFiles);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + queriedFiles.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/file/export-by-ids")
    public ResponseEntity<NgApiResponse<String>> exportFileByIds(@RequestBody List<Long> ids) {
        try {
            List<FileObject> selectedFiles = fileService.getByIds(ids);
            excelWriterService.writeFilesToExcel(buildExportPath("files_selected"), selectedFiles);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + selectedFiles.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    // ==================== LOTO STANDARD ====================

    @Transactional(readOnly = true)
    @GetMapping("/loto-standard/export-all")
    public ResponseEntity<NgApiResponse<String>> exportLotoStandardAll(
            @RequestParam(defaultValue = "compact") String format) {
        try {
            List<LotoStandard> all = lotoStandardService.getAll();
            writeLotoStandards(buildExportPath("loto_standards"), all, format);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + all.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @Transactional(readOnly = true)
    @PostMapping("/loto-standard/export-by-query")
    public ResponseEntity<NgApiResponse<String>> exportLotoStandardByQuery(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "compact") String format) {
        try {
            List<LotoStandard> queriedStandards = lotoStandardService.getBySearchCriteria(criteria);
            writeLotoStandards(buildExportPath("loto_standards_queried"), queriedStandards, format);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + queriedStandards.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @Transactional(readOnly = true)
    @PostMapping("/loto-standard/export-by-ids")
    public ResponseEntity<NgApiResponse<String>> exportLotoStandardByIds(
            @RequestBody List<Long> ids,
            @RequestParam(defaultValue = "compact") String format) {
        try {
            List<LotoStandard> selectedStandards = lotoStandardService.getByIds(ids);
            writeLotoStandards(buildExportPath("loto_standards_selected"), selectedStandards, format);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + selectedStandards.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    private void writeLotoStandards(String path, List<LotoStandard> data, String format) throws Exception {
        if ("detailed".equalsIgnoreCase(format)) {
            excelWriterService.writeLotoStandardsDetailed(path, data);
        } else {
            excelWriterService.writeLotoStandardsCompact(path, data);
        }
    }

    // ==================== WORK REQUEST ====================

    @GetMapping("/work-request/export-all")
    public ResponseEntity<NgApiResponse<String>> exportWorkRequestAll() {
        try {
            List<WorkRequest> all = workRequestService.getAll();
            excelWriterService.writeWorkRequestsToExcel(buildExportPath("work_requests"), all);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + all.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/work-request/export-by-query")
    public ResponseEntity<NgApiResponse<String>> exportWorkRequestByQuery(@RequestBody SearchCriteria criteria) {
        try {
            List<WorkRequest> queriedItems = workRequestService.getBySearchCriteria(criteria);
            excelWriterService.writeWorkRequestsToExcel(buildExportPath("work_requests_queried"), queriedItems);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + queriedItems.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/work-request/export-by-ids")
    public ResponseEntity<NgApiResponse<String>> exportWorkRequestByIds(@RequestBody List<Long> ids) {
        try {
            List<WorkRequest> selectedItems = workRequestService.getByIds(ids);
            excelWriterService.writeWorkRequestsToExcel(buildExportPath("work_requests_selected"), selectedItems);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + selectedItems.size() + " items exported"));
        } catch (Exception e) {
            log.error("Excel export failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    // ==================== LEGACY (backward compatibility) ====================

    /** @deprecated Use /loto-point/export-all instead */
    @GetMapping("/export-all")
    public ResponseEntity<NgApiResponse<String>> exportAll() {
        return exportLotoPointAll();
    }

    /** @deprecated Use /loto-point/export-by-query instead */
    @PostMapping("/export-by-query")
    public ResponseEntity<NgApiResponse<String>> exportByQuery(@RequestBody SearchCriteria criteria) {
        return exportLotoPointByQuery(criteria);
    }

    /** @deprecated Use /loto-point/export-by-ids instead */
    @PostMapping("/export-by-ids")
    public ResponseEntity<NgApiResponse<String>> exportByIds(@RequestBody List<Long> ids) {
        return exportLotoPointByIds(ids);
    }
}
