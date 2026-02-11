package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.pwa.PwaWorkRequestDto;
import com.dk_power.power_plant_java.sevice.pwa.PwaWorkRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pwa/work-request")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"https://dk-power.github.io", "http://localhost:4200"}, allowCredentials = "true")
public class PwaWorkRequestController {

    private final PwaWorkRequestService pwaService;

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

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
