package com.dk_power.power_plant_java.controller.angular.log;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventsResponseDto;
import com.dk_power.power_plant_java.sevice.logging.LogDiagnosticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ng/log-diagnostics")
@RequiredArgsConstructor
public class NgLogDiagnosticsController {

    private final LogDiagnosticsService logDiagnosticsService;

    @GetMapping("/events")
    public ResponseEntity<NgApiResponse<LogDiagnosticsEventsResponseDto>> getEvents(
        @RequestParam(defaultValue = "240") int windowMinutes,
        @RequestParam(defaultValue = "200") int limit,
        @RequestParam(required = false) String level,
        @RequestParam(required = false) String text,
        @RequestParam(required = false) String sourceFile,
        @RequestParam(required = false) String subsystem,
        @RequestParam(required = false) String eventCode,
        @RequestParam(required = false) String requestId,
        @RequestParam(required = false) String syncRunId,
        @RequestParam(required = false) String machineId
    ) {
        LogDiagnosticsEventsResponseDto events = logDiagnosticsService.getEvents(
            windowMinutes, limit, level, text, sourceFile, subsystem, eventCode,
            requestId, syncRunId, machineId
        );
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(events, "Log events retrieved"));
    }
}
