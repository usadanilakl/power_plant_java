package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaFieldListItemDto;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.pwa.PwaFieldListItemService;
import com.dk_power.power_plant_java.sevice.pwa.PwaReferenceDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa/field-list-item")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaFieldListItemController {

    private final PwaFieldListItemService pwaService;
    private final NgValueService valueService;
    private final PwaReferenceDataService referenceDataService;

    @PostMapping("/submit")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> submit(
            @RequestBody PwaFieldListItemDto dto) {
        try {
            log.info("[PWA FieldList] Received submission: localUuid={}, listType={}",
                    dto.getLocalUuid(), dto.getListTypeName());
            PwaSubmissionResult result = pwaService.submitFieldListItem(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Submission processed"));
        } catch (Exception e) {
            log.error("[PWA FieldList] Submission failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Submission failed: " + e.getMessage()));
        }
    }

    @GetMapping("/status/{localUuid}")
    public ResponseEntity<NgApiResponse<PwaStatusResult>> getStatus(
            @PathVariable String localUuid) {
        try {
            PwaStatusResult result = pwaService.getStatus(localUuid);
            if (result == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(new NgApiResponse<>(result, "Status found"));
        } catch (Exception e) {
            log.error("[PWA FieldList] Status check failed for localUuid={}: {}", localUuid, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Status check failed: " + e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> update(
            @RequestBody PwaFieldListItemDto dto) {
        try {
            log.info("[PWA FieldList] Received update: localUuid={}", dto.getLocalUuid());
            PwaSubmissionResult result = pwaService.updateFieldListItem(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Field list item updated"));
        } catch (Exception e) {
            log.error("[PWA FieldList] Update failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Update failed: " + e.getMessage()));
        }
    }

    @GetMapping("/list-types")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getListTypes() {
        try {
            List<Map<String, Object>> types = valueService.getValuesByCategory("FieldListType")
                    .stream()
                    .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName()))
                    .toList();
            return ResponseEntity.ok(new NgApiResponse<>(types, "Field list types retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No field list types found"));
        }
    }

    @GetMapping("/loto-points")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getLotoPoints() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(referenceDataService.getLotoPoints(), "Loto points retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed to get loto points"));
        }
    }

    @GetMapping("/locations")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getLocations() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(referenceDataService.getLocations(), "Locations retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No locations found"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
