package com.dk_power.power_plant_java.controller.angular.export;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelWriterService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ng/excel")
@AllArgsConstructor
public class ExcelController {
    private final ExcelWriterService excelWriterService;
    private final NgLotoPointService lotoPointService;
    private final NgFileService fileService;
    private final NgLotoStandardService lotoStandardService;

    // ==================== LOTO POINT ====================

    @GetMapping("/loto-point/export-all")
    public ResponseEntity<NgApiResponse<String>> exportLotoPointAll() {
        try {
            List<LotoPoint> all = lotoPointService.getAll();
            excelWriterService.writeLotoPointsToExcelTableWithLinks("loto_points.xlsx", all);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + all.size() + " items exported"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/loto-point/export-by-query")
    public ResponseEntity<NgApiResponse<String>> exportLotoPointByQuery(@RequestBody SearchCriteria criteria) {
        try {
            List<LotoPoint> queriedPoints = lotoPointService.getBySearchCriteria(criteria);
            excelWriterService.writeLotoPointsToExcelTableWithLinks("loto_points_queried.xlsx", queriedPoints);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + queriedPoints.size() + " items exported"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/loto-point/export-by-ids")
    public ResponseEntity<NgApiResponse<String>> exportLotoPointByIds(@RequestBody List<Long> ids) {
        try {
            List<LotoPoint> selectedPoints = lotoPointService.getByIds(ids);
            excelWriterService.writeLotoPointsToExcelTableWithLinks("loto_points_selected.xlsx", selectedPoints);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + selectedPoints.size() + " items exported"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    // ==================== FILE ====================

    @GetMapping("/file/export-all")
    public ResponseEntity<NgApiResponse<String>> exportFileAll() {
        try {
            List<FileObject> all = fileService.getAll();
            excelWriterService.writeFilesToExcel("files.xlsx", all);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + all.size() + " items exported"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/file/export-by-query")
    public ResponseEntity<NgApiResponse<String>> exportFileByQuery(@RequestBody SearchCriteria criteria) {
        try {
            List<FileObject> queriedFiles = fileService.getBySearchCriteria(criteria);
            excelWriterService.writeFilesToExcel("files_queried.xlsx", queriedFiles);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + queriedFiles.size() + " items exported"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/file/export-by-ids")
    public ResponseEntity<NgApiResponse<String>> exportFileByIds(@RequestBody List<Long> ids) {
        try {
            List<FileObject> selectedFiles = fileService.getByIds(ids);
            excelWriterService.writeFilesToExcel("files_selected.xlsx", selectedFiles);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + selectedFiles.size() + " items exported"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    // ==================== LOTO STANDARD ====================

    @GetMapping("/loto-standard/export-all")
    public ResponseEntity<NgApiResponse<String>> exportLotoStandardAll() {
        try {
            List<LotoStandard> all = lotoStandardService.getAll();
            excelWriterService.writeLotoStandardsToExcel("loto_standards.xlsx", all);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + all.size() + " items exported"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/loto-standard/export-by-query")
    public ResponseEntity<NgApiResponse<String>> exportLotoStandardByQuery(@RequestBody SearchCriteria criteria) {
        try {
            List<LotoStandard> queriedStandards = lotoStandardService.getBySearchCriteria(criteria);
            excelWriterService.writeLotoStandardsToExcel("loto_standards_queried.xlsx", queriedStandards);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + queriedStandards.size() + " items exported"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }

    @PostMapping("/loto-standard/export-by-ids")
    public ResponseEntity<NgApiResponse<String>> exportLotoStandardByIds(@RequestBody List<Long> ids) {
        try {
            List<LotoStandard> selectedStandards = lotoStandardService.getByIds(ids);
            excelWriterService.writeLotoStandardsToExcel("loto_standards_selected.xlsx", selectedStandards);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success - " + selectedStandards.size() + " items exported"));
        } catch (Exception e) {
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
