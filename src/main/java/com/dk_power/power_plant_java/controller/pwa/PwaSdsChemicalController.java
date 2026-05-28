package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaSdsChemicalDto;
import com.dk_power.power_plant_java.dto.pwa.PwaStatusResult;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.sevice.angular.sds.NgSdsChemicalService;
import com.dk_power.power_plant_java.sevice.pwa.PwaSdsChemicalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pwa/sds-chemical")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaSdsChemicalController {

    private final PwaSdsChemicalService pwaService;
    private final NgSdsChemicalService ngService;

    @PostMapping("/submit")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> submit(@RequestBody PwaSdsChemicalDto dto) {
        try {
            log.info("[PWA SDS] Submission: localUuid={}", dto.getLocalUuid());
            PwaSubmissionResult result = pwaService.submitSdsChemical(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Submission processed"));
        } catch (Exception e) {
            log.error("[PWA SDS] Submission failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Submission failed: " + e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> update(@RequestBody PwaSdsChemicalDto dto) {
        try {
            log.info("[PWA SDS] Update: localUuid={}", dto.getLocalUuid());
            return ResponseEntity.ok(new NgApiResponse<>(pwaService.updateSdsChemical(dto), "Update processed"));
        } catch (Exception e) {
            log.error("[PWA SDS] Update failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Update failed: " + e.getMessage()));
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

    @GetMapping("/active")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getActive() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngService.getActive(), "Active SDS chemicals retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No SDS chemicals found"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
