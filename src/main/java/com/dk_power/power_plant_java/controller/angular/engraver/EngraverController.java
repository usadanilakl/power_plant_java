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
     * List available LightBurn template files.
     */
    @GetMapping("/templates")
    public ResponseEntity<NgApiResponse<List<String>>> listTemplates() {
        List<String> templates = engraverService.listTemplateFiles();
        return ResponseEntity.ok(new NgApiResponse<>(templates, "Success"));
    }

    /**
     * Process a batch of LOTO points for engraving.
     * Generates CSV and optionally opens LightBurn with the selected template.
     */
    @PostMapping("/process-batch")
    public ResponseEntity<NgApiResponse<EngraverBatchResponse>> processBatch(
            @RequestBody List<Long> ids,
            @RequestParam(defaultValue = "true") boolean openLightBurn,
            @RequestParam(defaultValue = "false") boolean withQr,
            @RequestParam(required = false) String template,
            @RequestParam(defaultValue = "standard") String layoutVersion,
            @RequestParam(required = false) List<String> characteristicNames) {
        try {
            List<LotoPoint> points = lotoPointService.getByIds(ids);

            if (points.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "No LOTO points found for the provided IDs"));
            }

            String csvPath = (characteristicNames != null && !characteristicNames.isEmpty())
                    ? engraverService.generateCsvForBatch(points, withQr, characteristicNames)
                    : engraverService.generateCsvForBatch(points, withQr);

            if (openLightBurn && template != null && !template.isBlank()) {
                engraverService.openLightBurn(template);
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
     */
    @PostMapping("/open-lightburn")
    public ResponseEntity<NgApiResponse<String>> openLightBurn(
            @RequestParam String template) {
        try {
            engraverService.openLightBurn(template);
            return ResponseEntity.ok(new NgApiResponse<>("LightBurn opened", "Success"));
        } catch (Exception e) {
            log.error("Failed to open LightBurn: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    /**
     * Mark LOTO points as labeled after engraving.
     */
    @PostMapping("/mark-labeled")
    public ResponseEntity<NgApiResponse<String>> markLabeled(@RequestBody List<Long> ids) {
        try {
            lotoPointService.markAsLabeled(ids);
            return ResponseEntity.ok(new NgApiResponse<>(ids.size() + " points marked as labeled", "Success"));
        } catch (Exception e) {
            log.error("Failed to mark points as labeled: {}", e.getMessage());
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
