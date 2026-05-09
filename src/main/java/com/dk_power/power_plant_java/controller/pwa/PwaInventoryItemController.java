package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.inventory.InventoryItemDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInventoryItemDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInventoryUsageDto;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.inventory.NgInventoryItemService;
import com.dk_power.power_plant_java.sevice.pwa.PwaInventoryItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa/inventory-item")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaInventoryItemController {

    private final PwaInventoryItemService pwaService;
    private final NgInventoryItemService ngService;
    private final NgValueService valueService;

    @PostMapping("/submit")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> submit(@RequestBody PwaInventoryItemDto dto) {
        try {
            log.info("[PWA Inventory] Submission: localUuid={}, type={}", dto.getLocalUuid(), dto.getItemTypeName());
            PwaSubmissionResult result = pwaService.submitInventoryItem(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Submission processed"));
        } catch (Exception e) {
            log.error("[PWA Inventory] Submission failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Submission failed: " + e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> update(@RequestBody PwaInventoryItemDto dto) {
        try {
            log.info("[PWA Inventory] Update: localUuid={}", dto.getLocalUuid());
            return ResponseEntity.ok(new NgApiResponse<>(pwaService.updateInventoryItem(dto), "Update processed"));
        } catch (Exception e) {
            log.error("[PWA Inventory] Update failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Update failed: " + e.getMessage()));
        }
    }

    @PostMapping("/usage")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> recordUsage(@RequestBody PwaInventoryUsageDto dto) {
        try {
            log.info("[PWA Inventory] Usage: qrToken={}, eventType={}", dto.getQrToken(), dto.getEventType());
            return ResponseEntity.ok(new NgApiResponse<>(pwaService.recordUsage(dto), "Usage recorded"));
        } catch (Exception e) {
            log.error("[PWA Inventory] Usage failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Usage failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-qr/{qrToken}")
    public ResponseEntity<NgApiResponse<InventoryItemDto>> getByQrToken(@PathVariable String qrToken) {
        try {
            InventoryItemDto dto = ngService.getDtoByQrToken(qrToken);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/status/{localUuid}")
    public ResponseEntity<NgApiResponse<PwaStatusResult>> getStatus(@PathVariable String localUuid) {
        try {
            PwaStatusResult result = pwaService.getStatus(localUuid);
            if (result == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(new NgApiResponse<>(result, "Status found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/types")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getTypes() {
        try {
            List<Map<String, Object>> types = valueService.getValuesByCategory("InventoryType")
                    .stream()
                    .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName()))
                    .toList();
            return ResponseEntity.ok(new NgApiResponse<>(types, "Inventory types retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No inventory types found"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
