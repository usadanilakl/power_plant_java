package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaSdsAuditDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.dto.sds.SdsAuditRecordDto;
import com.dk_power.power_plant_java.sevice.angular.sds.NgSdsAuditService;
import com.dk_power.power_plant_java.sevice.pwa.PwaSdsAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pwa/sds-audit")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaSdsAuditController {

    private final PwaSdsAuditService pwaService;
    private final NgSdsAuditService ngService;

    @PostMapping("/submit")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> submit(@RequestBody PwaSdsAuditDto dto) {
        try {
            log.info("[PWA SDS Audit] Submission: chemical={}, action={}, campaign={}",
                    dto.getChemicalName(), dto.getAction(), dto.getCampaign());
            return ResponseEntity.ok(new NgApiResponse<>(pwaService.submitAudit(dto), "Audit processed"));
        } catch (Exception e) {
            log.error("[PWA SDS Audit] Submission failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Audit failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-campaign/{campaign}")
    public ResponseEntity<NgApiResponse<List<SdsAuditRecordDto>>> byCampaign(@PathVariable String campaign) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(pwaService.getByCampaign(campaign), "Audit records retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No audit records"));
        }
    }

    @GetMapping("/audited-uuids/{campaign}")
    public ResponseEntity<NgApiResponse<List<String>>> auditedUuids(@PathVariable String campaign) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(pwaService.getAuditedChemicalUuids(campaign), "Audited uuids retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No audited uuids"));
        }
    }

    @GetMapping("/campaigns")
    public ResponseEntity<NgApiResponse<List<String>>> campaigns() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ngService.getCampaigns(), "Campaigns retrieved"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "No campaigns"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
