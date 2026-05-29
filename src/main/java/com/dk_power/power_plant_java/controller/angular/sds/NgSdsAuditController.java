package com.dk_power.power_plant_java.controller.angular.sds;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.sds.SdsAuditRecordDto;
import com.dk_power.power_plant_java.sevice.angular.sds.NgSdsAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ng/sds-audit")
@Slf4j
public class NgSdsAuditController {

    private final NgSdsAuditService service;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<SdsAuditRecordDto>>> getAll() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getAll(), "Audit records retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-campaign/{campaign}")
    public ResponseEntity<NgApiResponse<List<SdsAuditRecordDto>>> byCampaign(@PathVariable String campaign) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getByCampaign(campaign), "Audit records retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-chemical/{uuid}")
    public ResponseEntity<NgApiResponse<List<SdsAuditRecordDto>>> byChemical(@PathVariable String uuid) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getByChemical(uuid), "Audit records retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/audited-uuids/{campaign}")
    public ResponseEntity<NgApiResponse<List<String>>> auditedUuids(@PathVariable String campaign) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getAuditedChemicalUuids(campaign), "Audited uuids retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/campaigns")
    public ResponseEntity<NgApiResponse<List<String>>> campaigns() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getCampaigns(), "Campaigns retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<SdsAuditRecordDto>> record(@RequestBody SdsAuditRecordDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.record(dto), "Audit recorded"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }
}
