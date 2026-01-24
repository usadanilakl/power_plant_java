package com.dk_power.power_plant_java.controller.angular.engraver;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.angular.engraver.EngraverService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ng/engrave")
@AllArgsConstructor
@Slf4j
public class EngraverController {

    private final EngraverService engraverService;
    private final NgLotoPointService lotoPointService;

    /**
     * Process a batch of LOTO points for engraving.
     * Generates CSV and optionally opens LightBurn.
     * @param ids List of LOTO point IDs to process
     * @param openLightBurn Whether to open LightBurn after generating CSV
     * @param withQr Whether to include QR codes and use QR template
     */
    @PostMapping("/process-batch")
    public ResponseEntity<NgApiResponse<EngraverBatchResponse>> processBatch(
            @RequestBody List<Long> ids,
            @RequestParam(defaultValue = "true") boolean openLightBurn,
            @RequestParam(defaultValue = "false") boolean withQr) {
        try {
            // Fetch LOTO points by IDs
            List<LotoPoint> points = lotoPointService.getByIds(ids);

            if (points.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "No LOTO points found for the provided IDs"));
            }

            // Generate CSV with QR option
            String csvPath = engraverService.generateCsvForBatch(points, withQr);

            // Open LightBurn if requested (with appropriate template)
            if (openLightBurn) {
                engraverService.openLightBurn(withQr);
            }

            EngraverBatchResponse response = new EngraverBatchResponse(
                    csvPath,
                    points.size(),
                    withQr,
                    "Batch processed successfully"
            );

            return ResponseEntity.ok(new NgApiResponse<>(response, "Success"));
        } catch (Exception e) {
            log.error("Failed to process engrave batch: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    /**
     * Get batch configuration info.
     */
    @GetMapping("/config")
    public ResponseEntity<NgApiResponse<EngraverConfigResponse>> getConfig() {
        EngraverConfigResponse config = new EngraverConfigResponse(
                engraverService.getBatchSize(),
                engraverService.getCsvFilePath()
        );
        return ResponseEntity.ok(new NgApiResponse<>(config, "Success"));
    }

    /**
     * Open LightBurn without generating new CSV (use existing).
     * @param withQr Whether to open the QR template or text-only template
     */
    @PostMapping("/open-lightburn")
    public ResponseEntity<NgApiResponse<String>> openLightBurn(
            @RequestParam(defaultValue = "false") boolean withQr) {
        try {
            engraverService.openLightBurn(withQr);
            return ResponseEntity.ok(new NgApiResponse<>("LightBurn opened", "Success"));
        } catch (Exception e) {
            log.error("Failed to open LightBurn: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    // Response DTOs
    public record EngraverBatchResponse(
            String csvPath,
            int itemCount,
            boolean withQr,
            String message
    ) {}

    public record EngraverConfigResponse(
            int batchSize,
            String csvPath
    ) {}
}
