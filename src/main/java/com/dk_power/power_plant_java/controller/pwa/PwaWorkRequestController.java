package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.pwa.PwaWorkRequestDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.dto.permits.WorkAreaMapShapeDto;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgWorkAreaService;
import com.dk_power.power_plant_java.sevice.pwa.PwaWorkRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.HtmlUtils;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa/work-request")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaWorkRequestController {

    private final PwaWorkRequestService pwaService;
    private final ObjectMapper objectMapper;
    private final NgValueService valueService;
    private final WorkAreaRepo workAreaRepo;
    private final com.dk_power.power_plant_java.sevice.pwa.PwaReferenceDataService referenceDataService;
    private final NgWorkAreaService workAreaService;

    @PostMapping("/submit")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> submit(
            @RequestBody PwaWorkRequestDto dto) {
        try {
            log.info("[PWA] Received work request submission: localUuid={}", dto.getLocalUuid());
            PwaSubmissionResult result = pwaService.submitWorkRequest(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Submission processed"));
        } catch (Exception e) {
            log.error("[PWA] Submission failed: {}", e.getMessage(), e);
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
            log.error("[PWA] Status check failed for localUuid={}: {}", localUuid, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Status check failed: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/submit-from-email", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> submitFromEmail(@RequestParam("data") String data) {
        try {
            String json = new String(Base64.getDecoder().decode(data));
            log.info("[PWA Email Link] Received submission from email link");
            PwaWorkRequestDto dto = objectMapper.readValue(json, PwaWorkRequestDto.class);
            PwaSubmissionResult result = pwaService.submitWorkRequest(dto);

            if ("duplicate".equals(result.getMethod())) {
                return htmlResponse("Already Submitted",
                        "This work request was already submitted (SharePoint ID: " + result.getSharepointId() + ").",
                        "#fff3cd", "#856404");
            }

            return htmlResponse("Work Request Submitted",
                    "Successfully submitted via " + result.getMethod()
                            + (result.getSharepointId() != null ? " (SharePoint ID: " + result.getSharepointId() + ")" : "")
                            + ".",
                    "#d4edda", "#155724");
        } catch (Exception e) {
            log.error("[PWA Email Link] Submission failed: {}", e.getMessage(), e);
            return htmlResponse("Submission Failed",
                    "Error: " + e.getMessage(),
                    "#f8d7da", "#721c24");
        }
    }

    /**
     * These pages are entirely self-contained — one inline &lt;style&gt;, no scripts, no images, no
     * network calls — so the tightest possible policy fits. It is a second, independent lock on the
     * same door as the HtmlUtils escaping below: if an unescaped value is ever reintroduced here,
     * injected markup still lands in the DOM but the browser refuses to execute it.
     */
    private static final String HTML_PAGE_CSP =
            "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; "
                    + "base-uri 'none'; form-action 'none'";

    private ResponseEntity<String> htmlResponse(String title, String message, String bgColor, String textColor) {
        return ResponseEntity.ok()
                .header("Content-Security-Policy", HTML_PAGE_CSP)
                .body(buildHtmlPage(title, message, bgColor, textColor));
    }

    private String buildHtmlPage(String title, String message, String bgColor, String textColor) {
        return """
                <!DOCTYPE html>
                <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex;
                         justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
                  .card { background: %s; color: %s; padding: 2rem 3rem; border-radius: 12px;
                          box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
                  h1 { margin: 0 0 1rem; font-size: 1.5rem; }
                  p { margin: 0; font-size: 1.1rem; }
                </style></head>
                <body><div class="card"><h1>%s</h1><p>%s</p></div></body></html>
                """.formatted(HtmlUtils.htmlEscape(title), bgColor, textColor,
                        HtmlUtils.htmlEscape(title), HtmlUtils.htmlEscape(message));
    }

    @PostMapping("/revoke")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> revoke(
            @RequestBody java.util.Map<String, String> payload) {
        try {
            String sharepointId = payload.getOrDefault("sharepointId", "");
            String localUuid = payload.getOrDefault("localUuid", "");
            // Either id identifies the request. Demanding a SharePoint id locked requesters out of
            // withdrawing anything submitted while SharePoint was unreachable.
            if (sharepointId.isEmpty() && localUuid.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "sharepointId or localUuid is required"));
            }
            log.info("[PWA] Received work request revoke: sharepointId={}, localUuid={}", sharepointId, localUuid);
            pwaService.revokeWorkRequest(sharepointId, localUuid);
            return ResponseEntity.ok(new NgApiResponse<>(
                    PwaSubmissionResult.success("sharepoint", sharepointId, localUuid),
                    "Work request revoked"));
        } catch (Exception e) {
            log.error("[PWA] Revoke failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Failed to revoke: " + e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> updateWorkRequest(
            @RequestBody PwaWorkRequestDto dto) {
        try {
            log.info("[PWA] Received work request update: localUuid={}", dto.getLocalUuid());
            PwaSubmissionResult result = pwaService.updateWorkRequest(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Work request updated"));
        } catch (Exception e) {
            log.error("[PWA] Update failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Update failed: " + e.getMessage()));
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getWorkCategories() {
        try {
            List<Map<String, Object>> categories = valueService.getValuesByCategory("Work Category")
                    .stream()
                    .map(v -> Map.<String, Object>of("id", v.getId(), "name", v.getName()))
                    .toList();
            return ResponseEntity.ok(new NgApiResponse<>(categories, "Work categories retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No work categories found"));
        }
    }

    @GetMapping("/work-areas")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getWorkAreas() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(referenceDataService.getWorkAreas(), "Work areas retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Failed to get work areas: " + e.getMessage()));
        }
    }

    @GetMapping("/work-areas/{id}/hazards")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getWorkAreaHazards(@PathVariable Long id) {
        try {
            WorkArea wa = workAreaRepo.findById(id).orElse(null);
            if (wa == null) {
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> hazards = new LinkedHashMap<>();
            hazards.put("workAreaId", wa.getId());
            hazards.put("workAreaName", wa.getName());
            hazards.put("constantHazards", wa.getConstantHazards());
            hazards.put("constantHotWorkMeasures", wa.getConstantHotWorkMeasures());
            hazards.put("constantConfinedSpaceHazards", wa.getConstantConfinedSpaceHazards());
            hazards.put("isConfinedSpace", referenceDataService.hasConfinedSpaceHazards(wa));
            return ResponseEntity.ok(new NgApiResponse<>(hazards, "Work area hazards retrieved"));
        } catch (Exception e) {
            log.error("[PWA] Failed to get hazards for work area {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Failed to get work area hazards: " + e.getMessage()));
        }
    }

    @GetMapping("/work-area-shapes")
    public ResponseEntity<NgApiResponse<List<WorkAreaMapShapeDto>>> getWorkAreaShapes() {
        try {
            List<WorkAreaMapShapeDto> shapes = workAreaService.getAllShapes();
            return ResponseEntity.ok(new NgApiResponse<>(shapes, "Work area shapes retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No work area shapes found"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
