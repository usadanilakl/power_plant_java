package com.dk_power.power_plant_java.controller.angular.etapro;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.etapro.EtaProReportDto;
import com.dk_power.power_plant_java.dto.etapro.EtaProReportExecutionDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProReport;
import com.dk_power.power_plant_java.entities.etapro.EtaProReportExecution;
import com.dk_power.power_plant_java.entities.etapro.EtaProReportExecution.Status;
import com.dk_power.power_plant_java.entities.etapro.report.ReportDefinition;
import com.dk_power.power_plant_java.entities.etapro.report.ReportParams;
import com.dk_power.power_plant_java.entities.etapro.report.ReportResults;
import com.dk_power.power_plant_java.repository.etapro.EtaProReportExecutionRepo;
import com.dk_power.power_plant_java.sevice.angular.etapro.NgEtaProReportService;
import com.dk_power.power_plant_java.sevice.etapro.report.EtaProReportEngine;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ng/etapro/reports")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class NgEtaProReportController {

    private final NgEtaProReportService reportService;
    private final EtaProReportExecutionRepo executionRepo;
    private final EtaProReportEngine reportEngine;
    private final ObjectMapper objectMapper;

    // ── Report CRUD ────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<NgApiResponse<Page<EtaProReportDto>>> listReports(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        Page<EtaProReportDto> result = reportService.getAll(page - 1, pageSize);
        return ResponseEntity.ok(new NgApiResponse<>(result, "Reports retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<EtaProReportDto>> getReport(@PathVariable Long id) {
        EtaProReportDto dto = reportService.getDtoById(id);
        return ResponseEntity.ok(new NgApiResponse<>(dto, "Report retrieved"));
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<EtaProReportDto>> createReport(@RequestBody EtaProReportDto dto) {
        EtaProReport entity = reportService.toEntity(dto);
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setCategory(dto.getCategory());
        entity.setDefinitionVersion(dto.getDefinitionVersion() > 0 ? dto.getDefinitionVersion() : 1);
        entity.setDefinitionJson(dto.getDefinitionJson());
        entity.setDefaultParamsJson(dto.getDefaultParamsJson());
        entity.setOutputConfigJson(dto.getOutputConfigJson());
        EtaProReport saved = reportService.save(entity);
        return ResponseEntity.ok(new NgApiResponse<>(reportService.toDto(saved), "Report created"));
    }

    @PutMapping
    public ResponseEntity<NgApiResponse<EtaProReportDto>> updateReport(@RequestBody EtaProReportDto dto) {
        EtaProReport existing = reportService.getEntityById(dto.getId());
        if (existing == null) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Report not found"));
        }
        if (dto.getName() != null) existing.setName(dto.getName());
        if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
        if (dto.getCategory() != null) existing.setCategory(dto.getCategory());
        if (dto.getDefinitionJson() != null) existing.setDefinitionJson(dto.getDefinitionJson());
        if (dto.getDefaultParamsJson() != null) existing.setDefaultParamsJson(dto.getDefaultParamsJson());
        if (dto.getOutputConfigJson() != null) existing.setOutputConfigJson(dto.getOutputConfigJson());
        existing.setDefinitionVersion(dto.getDefinitionVersion());
        EtaProReport saved = reportService.save(existing);
        return ResponseEntity.ok(new NgApiResponse<>(reportService.toDto(saved), "Report updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> deleteReport(@PathVariable Long id) {
        reportService.softDelete(id);
        return ResponseEntity.ok(new NgApiResponse<>("Deleted", "Report soft-deleted"));
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<EtaProReportDto>>> searchReports(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        try {
            String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "name";
            String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
            Page<EtaProReportDto> results = reportService.complexSearch(
                    criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            return ResponseEntity.ok(new NgApiResponse<>(results, "Search completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ── Executions ─────────────────────────────────────────────

    public record ExecuteRequest(String paramsJson) {}

    @PostMapping("/{reportId}/execute")
    public ResponseEntity<NgApiResponse<EtaProReportExecutionDto>> executeReport(
            @PathVariable Long reportId,
            @RequestBody(required = false) ExecuteRequest request) {
        EtaProReport report = reportService.getEntityById(reportId);
        if (report == null) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Report not found"));
        }

        EtaProReportExecution exec = new EtaProReportExecution();
        exec.setReport(report);
        exec.setStatus(Status.PENDING);
        exec.setParamsJson(request != null ? request.paramsJson() : null);
        exec.setProgress(0);
        executionRepo.save(exec);

        return ResponseEntity.ok(new NgApiResponse<>(toExecDto(exec), "Execution submitted"));
    }

    /**
     * Synchronous preview — runs the report inline and returns results immediately.
     * Use for small time windows during report building to validate rules.
     */
    @PostMapping("/preview")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> previewReport(
            @RequestBody Map<String, String> body) {
        try {
            String definitionJson = body.get("definitionJson");
            String paramsJson = body.get("paramsJson");

            ReportDefinition definition = objectMapper.readValue(definitionJson, ReportDefinition.class);
            ReportParams params = (paramsJson != null && !paramsJson.isBlank())
                    ? objectMapper.readValue(paramsJson, ReportParams.class)
                    : new ReportParams();

            // Limit preview to avoid long-running queries
            if (params.getMaxInstances() > 5) params.setMaxInstances(5);

            EtaProReportEngine.ExecutionResult result = reportEngine.execute(definition, params);

            Map<String, Object> response = Map.of(
                    "summary", result.summary(),
                    "payload", result.payload()
            );
            return ResponseEntity.ok(new NgApiResponse<>(response, "Preview complete"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Preview failed: " + e.getMessage()));
        }
    }

    @GetMapping("/executions")
    public ResponseEntity<NgApiResponse<Page<EtaProReportExecutionDto>>> listExecutions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        Page<EtaProReportExecutionDto> result = executionRepo
                .findAllByOrderByDateCreatedDesc(PageRequest.of(page - 1, pageSize))
                .map(this::toExecDto);
        return ResponseEntity.ok(new NgApiResponse<>(result, "Executions retrieved"));
    }

    @GetMapping("/executions/{id}")
    public ResponseEntity<NgApiResponse<EtaProReportExecutionDto>> getExecution(@PathVariable Long id) {
        return executionRepo.findById(id)
                .map(exec -> ResponseEntity.ok(new NgApiResponse<>(toExecDto(exec), "Execution retrieved")))
                .orElseGet(() -> ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Execution not found")));
    }

    @DeleteMapping("/executions/{id}")
    public ResponseEntity<NgApiResponse<String>> cancelExecution(@PathVariable Long id) {
        executionRepo.findById(id).ifPresent(exec -> {
            if (exec.getStatus() == Status.PENDING || exec.getStatus() == Status.RUNNING) {
                exec.setStatus(Status.CANCELLED);
                executionRepo.save(exec);
            }
        });
        return ResponseEntity.ok(new NgApiResponse<>("Cancelled", "Execution cancellation requested"));
    }

    // ── DTO mapping ────────────────────────────────────────────

    private EtaProReportExecutionDto toExecDto(EtaProReportExecution exec) {
        EtaProReportExecutionDto dto = new EtaProReportExecutionDto();
        dto.setId(exec.getId());
        dto.setReportId(exec.getReport() != null ? exec.getReport().getId() : null);
        dto.setReportName(exec.getReport() != null ? exec.getReport().getName() : null);
        dto.setStatus(exec.getStatus() != null ? exec.getStatus().name() : null);
        dto.setParamsJson(exec.getParamsJson());
        dto.setSummaryJson(exec.getSummaryJson());
        dto.setResultPayloadJson(exec.getResultPayloadJson());
        dto.setProgress(exec.getProgress());
        dto.setInstancesFound(exec.getInstancesFound());
        dto.setStartedAt(exec.getStartedAt());
        dto.setCompletedAt(exec.getCompletedAt());
        dto.setDurationMs(exec.getDurationMs());
        dto.setErrorMessage(exec.getErrorMessage());
        return dto;
    }
}
