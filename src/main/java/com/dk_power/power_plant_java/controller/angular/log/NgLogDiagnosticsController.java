package com.dk_power.power_plant_java.controller.angular.log;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventsResponseDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentDetailDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentStatusUpdateDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsIncidentsResponseDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsOverviewDto;
import com.dk_power.power_plant_java.sevice.logging.LogDiagnosticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ng/log-diagnostics")
@RequiredArgsConstructor
public class NgLogDiagnosticsController {

    private final LogDiagnosticsService logDiagnosticsService;

    @GetMapping("/overview")
    public ResponseEntity<NgApiResponse<LogDiagnosticsOverviewDto>> getOverview(
        @RequestParam(defaultValue = "240") int windowMinutes,
        @RequestParam(defaultValue = "100") int limit
    ) {
        LogDiagnosticsOverviewDto overview = logDiagnosticsService.getOverview(windowMinutes, limit);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(overview, "Log diagnostics overview retrieved"));
    }

    @GetMapping("/events")
    public ResponseEntity<NgApiResponse<LogDiagnosticsEventsResponseDto>> getEvents(
        @RequestParam(defaultValue = "240") int windowMinutes,
        @RequestParam(defaultValue = "200") int limit,
        @RequestParam(required = false) String level,
        @RequestParam(required = false) String text,
        @RequestParam(required = false) String sourceFile,
        @RequestParam(required = false) String requestId,
        @RequestParam(required = false) String syncRunId,
        @RequestParam(required = false) String machineId
    ) {
        LogDiagnosticsEventsResponseDto events = logDiagnosticsService.getEvents(
            windowMinutes,
            limit,
            level,
            text,
            sourceFile,
            requestId,
            syncRunId,
            machineId
        );
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(events, "Log diagnostics events retrieved"));
    }

    @GetMapping("/incidents")
    public ResponseEntity<NgApiResponse<LogDiagnosticsIncidentsResponseDto>> getIncidents(
        @RequestParam(defaultValue = "240") int windowMinutes,
        @RequestParam(defaultValue = "50") int limit,
        @RequestParam(required = false) String status
    ) {
        LogDiagnosticsIncidentsResponseDto incidents = logDiagnosticsService.getIncidents(windowMinutes, limit, status);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(incidents, "Log diagnostics incidents retrieved"));
    }

    @GetMapping("/incidents/{incidentId}")
    public ResponseEntity<NgApiResponse<LogDiagnosticsIncidentDetailDto>> getIncidentDetail(
        @PathVariable String incidentId,
        @RequestParam(defaultValue = "240") int windowMinutes,
        @RequestParam(defaultValue = "100") int timelineLimit
    ) {
        LogDiagnosticsIncidentDetailDto incident = logDiagnosticsService.getIncidentDetail(incidentId, windowMinutes, timelineLimit);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(incident, "Log diagnostics incident detail retrieved"));
    }

    @PostMapping("/incidents/{incidentId}/status")
    public ResponseEntity<NgApiResponse<LogDiagnosticsIncidentDto>> updateIncidentStatus(
        @PathVariable String incidentId,
        @RequestBody LogDiagnosticsIncidentStatusUpdateDto request,
        @RequestParam(defaultValue = "240") int windowMinutes
    ) {
        LogDiagnosticsIncidentDto incident = logDiagnosticsService.updateIncidentStatus(incidentId, request.status(), windowMinutes);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(incident, "Log diagnostics incident status updated"));
    }
}
