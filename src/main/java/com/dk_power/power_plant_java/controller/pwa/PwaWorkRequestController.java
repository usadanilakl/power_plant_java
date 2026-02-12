package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.pwa.PwaWorkRequestDto;
import com.dk_power.power_plant_java.sevice.pwa.PwaWorkRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@RestController
@RequestMapping("/api/pwa/work-request")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"https://dk-power.github.io", "http://localhost:4200"}, allowCredentials = "true")
public class PwaWorkRequestController {

    private final PwaWorkRequestService pwaService;
    private final ObjectMapper objectMapper;

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
                return ResponseEntity.ok(buildHtmlPage("Already Submitted",
                        "This work request was already submitted (SharePoint ID: " + result.getSharepointId() + ").",
                        "#fff3cd", "#856404"));
            }

            return ResponseEntity.ok(buildHtmlPage("Work Request Submitted",
                    "Successfully submitted via " + result.getMethod()
                            + (result.getSharepointId() != null ? " (SharePoint ID: " + result.getSharepointId() + ")" : "")
                            + ".",
                    "#d4edda", "#155724"));
        } catch (Exception e) {
            log.error("[PWA Email Link] Submission failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(buildHtmlPage("Submission Failed",
                    "Error: " + e.getMessage(),
                    "#f8d7da", "#721c24"));
        }
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
                """.formatted(title, bgColor, textColor, title, message);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
