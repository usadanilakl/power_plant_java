package com.dk_power.power_plant_java.controller.angular.instrumentation;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.instrumentation.BulkUploadResult;
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
    public ResponseEntity<NgApiResponse<List<InstrumentDto>>> preview(@RequestParam("file") MultipartFile file) {
        try {
            List<InstrumentDto> instruments = parseFile(file);
            return ResponseEntity.ok(new NgApiResponse<>(instruments,
                    "Parsed " + instruments.size() + " instruments"));
        } catch (Exception e) {
            log.error("[BulkUpload] Preview failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(List.of(), "Parse failed: " + e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<NgApiResponse<BulkUploadResult>> upload(@RequestParam("file") MultipartFile file) {
        try {
            List<InstrumentDto> instruments = parseFile(file);
            BulkUploadResult result = bulkUploadService.uploadToSharePoint(instruments);
            return ResponseEntity.ok(new NgApiResponse<>(result,
                    String.format("Upload complete: %d created, %d updated, %d failed",
                            result.getCreated(), result.getUpdated(), result.getFailed())));
        } catch (Exception e) {
            log.error("[BulkUpload] Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Upload failed: " + e.getMessage()));
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
