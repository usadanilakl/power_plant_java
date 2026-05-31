package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.users.ContractorChangeReportDto;
import com.dk_power.power_plant_java.dto.users.ContractorDto;
import com.dk_power.power_plant_java.dto.users.ContractorsImportRequest;
import com.dk_power.power_plant_java.entities.users.ContractorChangeReport;
import com.dk_power.power_plant_java.sevice.users.ContractorReconciler;
import com.dk_power.power_plant_java.sevice.users.ContractorSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ng/contractors")
@RequiredArgsConstructor
@Slf4j
public class NgContractorController {

    private final ContractorSyncService contractorSyncService;
    private final ContractorReconciler contractorReconciler;

    @PostMapping("/sync")
    public ResponseEntity<NgApiResponse<ContractorSyncService.ImportSummary>> sync(
            @RequestBody ContractorsImportRequest request) {
        try {
            ContractorSyncService.ImportSummary summary = contractorSyncService.importFromElectron(request);
            return ResponseEntity.ok(new NgApiResponse<>(summary, "Contractors imported"));
        } catch (Exception e) {
            log.error("[Contractors] Sync failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<NgApiResponse<List<ContractorDto>>> list() {
        return ResponseEntity.ok(new NgApiResponse<>(contractorSyncService.listContractors(), "Contractors listed"));
    }

    @PostMapping("/scan")
    public ResponseEntity<NgApiResponse<ContractorChangeReportDto>> scan() {
        try {
            ContractorChangeReport report = contractorReconciler.scanNow();
            return ResponseEntity.ok(new NgApiResponse<>(contractorSyncService.toDto(report), "Scan complete"));
        } catch (Exception e) {
            log.error("[Contractors] Scan failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<NgApiResponse<List<ContractorChangeReportDto>>> reports(
            @RequestParam(required = false) String status) {
        ContractorChangeReport.Status s = parseStatus(status);
        List<ContractorChangeReportDto> dtos = contractorSyncService.listReports(s).stream()
                .map(contractorSyncService::toDto)
                .toList();
        return ResponseEntity.ok(new NgApiResponse<>(dtos, "Reports listed"));
    }

    @PostMapping("/reports/{id}/accept")
    public ResponseEntity<NgApiResponse<ContractorChangeReportDto>> accept(@PathVariable Long id) {
        try {
            ContractorChangeReport report = contractorSyncService.accept(id, currentUsername());
            return ResponseEntity.ok(new NgApiResponse<>(contractorSyncService.toDto(report), "Report accepted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/reports/{id}/reject")
    public ResponseEntity<NgApiResponse<ContractorChangeReportDto>> reject(@PathVariable Long id) {
        try {
            ContractorChangeReport report = contractorSyncService.reject(id, currentUsername());
            return ResponseEntity.ok(new NgApiResponse<>(contractorSyncService.toDto(report), "Report rejected"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private ContractorChangeReport.Status parseStatus(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return ContractorChangeReport.Status.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? "system" : auth.getName();
    }
}
