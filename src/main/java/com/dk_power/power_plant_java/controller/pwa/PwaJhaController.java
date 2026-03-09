package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaJhaDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.sevice.pwa.PwaJhaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@RestController
@RequestMapping("/api/pwa/jha")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaJhaController {

    private final PwaJhaService pwaJhaService;
    private final ObjectMapper objectMapper;

    @PostMapping("/submit")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> submit(
            @RequestBody PwaJhaDto dto) {
        try {
            log.info("[PWA JHA] Received JHA submission: localUuid={}", dto.getLocalUuid());
            PwaSubmissionResult result = pwaJhaService.submitJha(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "JHA submission processed"));
        } catch (Exception e) {
            log.error("[PWA JHA] Submission failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "JHA submission failed: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/submit-from-email", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> submitFromEmail(@RequestParam("data") String data) {
        try {
            String json = new String(Base64.getDecoder().decode(data));
            log.info("[PWA JHA Email Link] Received JHA submission from email link");
            PwaJhaDto dto = objectMapper.readValue(json, PwaJhaDto.class);
            PwaSubmissionResult result = pwaJhaService.submitJha(dto);

            if ("duplicate".equals(result.getMethod())) {
                return ResponseEntity.ok(buildHtmlPage("Already Submitted",
                        "This JHA was already submitted (SharePoint ID: " + result.getSharepointId() + ").",
                        "#fff3cd", "#856404"));
            }

            return ResponseEntity.ok(buildHtmlPage("JHA Submitted",
                    "Successfully submitted via " + result.getMethod()
                            + (result.getSharepointId() != null ? " (SharePoint ID: " + result.getSharepointId() + ")" : "")
                            + ".",
                    "#d4edda", "#155724"));
        } catch (Exception e) {
            log.error("[PWA JHA Email Link] Submission failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(buildHtmlPage("JHA Submission Failed",
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

    @PostMapping("/revoke")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> revoke(
            @RequestBody java.util.Map<String, String> payload) {
        try {
            String sharepointId = payload.get("sharepointId");
            String localUuid = payload.getOrDefault("localUuid", "");
            if (sharepointId == null || sharepointId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "sharepointId is required"));
            }
            log.info("[PWA JHA] Received JHA revoke: sharepointId={}", sharepointId);
            pwaJhaService.revokeJha(sharepointId);
            return ResponseEntity.ok(new NgApiResponse<>(
                    PwaSubmissionResult.success("sharepoint", sharepointId, localUuid),
                    "JHA revoked"));
        } catch (Exception e) {
            log.error("[PWA JHA] Revoke failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Failed to revoke JHA: " + e.getMessage()));
        }
    }
}
