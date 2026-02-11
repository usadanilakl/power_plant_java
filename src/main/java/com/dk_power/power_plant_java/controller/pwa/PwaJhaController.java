package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaJhaDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.sevice.pwa.PwaJhaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pwa/jha")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"https://dk-power.github.io", "http://localhost:4200"}, allowCredentials = "true")
public class PwaJhaController {

    private final PwaJhaService pwaJhaService;

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
}
