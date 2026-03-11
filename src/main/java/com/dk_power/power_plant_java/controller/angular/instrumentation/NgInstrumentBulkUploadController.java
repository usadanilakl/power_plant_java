package com.dk_power.power_plant_java.controller.angular.instrumentation;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.instrumentation.BulkUploadResult;
import com.dk_power.power_plant_java.dto.instrumentation.CounterpartCheckReportDto;
import com.dk_power.power_plant_java.dto.instrumentation.CounterpartCreateResultDto;
import com.dk_power.power_plant_java.dto.instrumentation.DuplicateCheckReportDto;
import com.dk_power.power_plant_java.dto.instrumentation.DuplicateMergeResultDto;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.sevice.instrumentation.InstrumentBulkUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/ng/instruments/bulk")
@RequiredArgsConstructor
@Slf4j
public class NgInstrumentBulkUploadController {

    private final InstrumentBulkUploadService bulkUploadService;

    @PostMapping("/preview")
    public ResponseEntity<NgApiResponse<List<InstrumentDto>>> preview(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tagMode", defaultValue = "as_is") String tagMode) {
        try {
            List<InstrumentDto> instruments = parseFile(file);
            instruments = bulkUploadService.previewByTagMode(instruments, tagMode);
            return ResponseEntity.ok(new NgApiResponse<>(instruments,
                    "Parsed " + instruments.size() + " instruments"));
        } catch (Exception e) {
            log.error("[BulkUpload] Preview failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(List.of(), "Parse failed: " + e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<NgApiResponse<BulkUploadResult>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "onConflict", defaultValue = "merge") String onConflict,
            @RequestParam(value = "tagMode", defaultValue = "as_is") String tagMode) {
        try {
            List<InstrumentDto> instruments = parseFile(file);
            BulkUploadResult result = bulkUploadService.uploadToSharePoint(instruments, onConflict, tagMode);
            return ResponseEntity.ok(new NgApiResponse<>(result,
                    String.format("Upload complete: %d created, %d updated, %d skipped, %d failed",
                            result.getCreated(), result.getUpdated(), result.getSkipped(), result.getFailed())));
        } catch (Exception e) {
            log.error("[BulkUpload] Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/counterpart-check")
    public ResponseEntity<NgApiResponse<CounterpartCheckReportDto>> counterpartCheck() {
        try {
            CounterpartCheckReportDto report = bulkUploadService.checkCounterparts();
            return ResponseEntity.ok(new NgApiResponse<>(report, "Counterpart check complete"));
        } catch (Exception e) {
            log.error("[BulkUpload] Counterpart check failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Counterpart check failed: " + e.getMessage()));
        }
    }

    @PostMapping("/counterpart-create-missing")
    public ResponseEntity<NgApiResponse<CounterpartCreateResultDto>> createMissingCounterparts() {
        try {
            CounterpartCreateResultDto result = bulkUploadService.createMissingCounterparts();
            return ResponseEntity.ok(new NgApiResponse<>(result, "Missing counterpart creation complete"));
        } catch (Exception e) {
            log.error("[BulkUpload] Create missing counterparts failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Create missing counterparts failed: " + e.getMessage()));
        }
    }

    @GetMapping("/duplicates-check")
    public ResponseEntity<NgApiResponse<DuplicateCheckReportDto>> duplicatesCheck() {
        try {
            DuplicateCheckReportDto report = bulkUploadService.checkDuplicatesByTag();
            return ResponseEntity.ok(new NgApiResponse<>(report, "Duplicate check complete"));
        } catch (Exception e) {
            log.error("[BulkUpload] Duplicate check failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Duplicate check failed: " + e.getMessage()));
        }
    }

    @PostMapping("/duplicates-merge")
    public ResponseEntity<NgApiResponse<DuplicateMergeResultDto>> mergeDuplicates() {
        try {
            DuplicateMergeResultDto result = bulkUploadService.mergeDuplicatesByTag();
            return ResponseEntity.ok(new NgApiResponse<>(result, "Duplicate merge complete"));
        } catch (Exception e) {
            log.error("[BulkUpload] Duplicate merge failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Duplicate merge failed: " + e.getMessage()));
        }
    }

    private List<InstrumentDto> parseFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename == null) throw new IllegalArgumentException("No filename provided");

        if (filename.endsWith(".csv")) {
            return bulkUploadService.parseCSV(file.getInputStream());
        } else if (filename.endsWith(".xlsx")) {
            return bulkUploadService.parseExcel(file.getInputStream());
        } else {
            throw new IllegalArgumentException("Unsupported file type. Use .csv or .xlsx");
        }
    }
}
