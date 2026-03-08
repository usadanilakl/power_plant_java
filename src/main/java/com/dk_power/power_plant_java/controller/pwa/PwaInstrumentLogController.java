package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaInstrumentLogDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.sevice.pwa.PwaInstrumentLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pwa/instrument-log")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"https://dk-power.github.io", "http://localhost:4200"}, allowCredentials = "true")
public class PwaInstrumentLogController {

    private final PwaInstrumentLogService pwaService;

    @PostMapping("/submit")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> submit(
            @RequestBody PwaInstrumentLogDto dto) {
        try {
            log.info("[PWA] Received instrument log submission: localUuid={}, tagNumber={}",
                    dto.getLocalUuid(), dto.getInstrumentTagNumber());
            PwaSubmissionResult result = pwaService.submitInstrumentLog(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Submission processed"));
        } catch (Exception e) {
            log.error("[PWA] Instrument log submission failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Submission failed: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
