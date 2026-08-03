package com.dk_power.power_plant_java.controller.angular.log;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventsResponseDto;
import com.dk_power.power_plant_java.sevice.logging.LogDiagnosticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/ng/log-diagnostics")
@RequiredArgsConstructor
@RestrictedAllowed
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
        @RequestParam(required = false) String machineId,
        @RequestParam(required = false) Instant from,
        @RequestParam(required = false) Instant to,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "desc") String sort
    ) {
        LogDiagnosticsEventsResponseDto events = logDiagnosticsService.getEvents(
            windowMinutes, limit, level, text, sourceFile, subsystem, eventCode,
            requestId, syncRunId, machineId, from, to, cursor, sort
        );
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header(HttpHeaders.PRAGMA, "no-cache")
            .contentType(MediaType.APPLICATION_JSON)
            .body(new NgApiResponse<>(events, "Log events retrieved"));
    }
}
