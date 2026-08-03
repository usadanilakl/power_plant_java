package com.dk_power.power_plant_java.controller.ai.diagnostics;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsPrincipal;
import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsScope;
import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsEventsPageDto;
import com.dk_power.power_plant_java.dto.logging.ai.AiDiagnosticsBundleRequestDto;
import com.dk_power.power_plant_java.sevice.logging.ai.AiDiagnosticsBundleService;
import com.dk_power.power_plant_java.sevice.logging.ai.AiDiagnosticsConnectionLimitException;
import com.dk_power.power_plant_java.sevice.logging.ai.AiDiagnosticsQueryService;
import com.dk_power.power_plant_java.sevice.logging.ai.AiDiagnosticsRateLimitException;
import com.dk_power.power_plant_java.sevice.logging.ai.AiDiagnosticsRateLimiter;
import com.dk_power.power_plant_java.sevice.logging.ai.AiDiagnosticsStreamService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import jakarta.servlet.http.HttpServletResponse;

import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ng/ai-diagnostics/v1")
@RestrictedAllowed
@ConditionalOnProperty(name = "logging.ai-diagnostics.enabled", havingValue = "true")
public class AiDiagnosticsController {

    private final AiDiagnosticsQueryService queryService;
    private final AiDiagnosticsStreamService streamService;
    private final AiDiagnosticsBundleService bundleService;
    private final AiDiagnosticsRateLimiter rateLimiter;

    public AiDiagnosticsController(
        AiDiagnosticsQueryService queryService,
        AiDiagnosticsStreamService streamService,
        AiDiagnosticsBundleService bundleService,
        AiDiagnosticsRateLimiter rateLimiter
    ) {
        this.queryService = queryService;
        this.streamService = streamService;
        this.bundleService = bundleService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping(value = "/events", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AiDiagnosticsEventsPageDto> events(
        Authentication authentication,
        @RequestParam(required = false) Instant from,
        @RequestParam(required = false) Instant to,
        @RequestParam(defaultValue = "200") int limit,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "desc") String sort,
        @RequestParam(defaultValue = "WARN,ERROR") String levels,
        @RequestParam(required = false) String text,
        @RequestParam(required = false) String sourceFile,
        @RequestParam(required = false) String subsystem,
        @RequestParam(required = false) String eventCode,
        @RequestParam(required = false) String requestId,
        @RequestParam(required = false) String syncRunId,
        @RequestParam(required = false) String machineId
    ) {
        AiDiagnosticsPrincipal principal = requirePrincipal(authentication, AiDiagnosticsScope.LOGS_READ);
        enforceRateLimit(principal, AiDiagnosticsRateLimiter.Operation.HISTORICAL);
        try {
            AiDiagnosticsEventsPageDto page = queryService.query(
                principal.identity(), from, to, limit, cursor, sort, parseLevels(levels), text,
                sourceFile, subsystem, eventCode, requestId, syncRunId, machineId);
            return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(page);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @GetMapping(value = "/events/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
        Authentication authentication,
        @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
        @RequestParam(required = false) String subsystem,
        @RequestParam(required = false) String eventCode,
        @RequestParam(required = false) String requestId,
        @RequestParam(required = false) String syncRunId,
        @RequestParam(required = false) String machineId,
        HttpServletResponse response
    ) {
        AiDiagnosticsPrincipal principal = requirePrincipal(authentication, AiDiagnosticsScope.LOGS_STREAM);
        enforceRateLimit(principal, AiDiagnosticsRateLimiter.Operation.STREAM_OPEN);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        try {
            return streamService.subscribe(
                principal, lastEventId, subsystem, eventCode, requestId, syncRunId, machineId);
        } catch (AiDiagnosticsConnectionLimitException e) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    @PostMapping(value = "/bundles", produces = "application/x-ndjson")
    public ResponseEntity<byte[]> bundle(
        Authentication authentication,
        @RequestBody(required = false) AiDiagnosticsBundleRequestDto request
    ) {
        AiDiagnosticsPrincipal principal = requirePrincipal(
            authentication, AiDiagnosticsScope.DIAGNOSTICS_BUNDLE);
        enforceRateLimit(principal, AiDiagnosticsRateLimiter.Operation.BUNDLE);
        try {
            var bundle = bundleService.create(principal.identity(), request);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=ai-diagnostics-" + Instant.now().toEpochMilli() + ".ndjson")
                .header("X-Diagnostics-Event-Count", Integer.toString(bundle.eventCount()))
                .header("X-Diagnostics-Truncated", Boolean.toString(bundle.truncated()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .contentType(MediaType.parseMediaType("application/x-ndjson"))
                .body(bundle.content());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    private AiDiagnosticsPrincipal requirePrincipal(
        Authentication authentication,
        AiDiagnosticsScope requiredScope
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AiDiagnosticsPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Service authentication required");
        }
        if (!principal.hasScope(requiredScope)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Required scope is missing");
        }
        return principal;
    }

    private void enforceRateLimit(
        AiDiagnosticsPrincipal principal,
        AiDiagnosticsRateLimiter.Operation operation
    ) {
        AiDiagnosticsRateLimiter.Decision decision = rateLimiter.check(principal.identity(), operation);
        if (!decision.allowed()) {
            throw new AiDiagnosticsRateLimitException(decision.retryAfterSeconds());
        }
    }

    @ExceptionHandler(AiDiagnosticsRateLimitException.class)
    public ResponseEntity<Map<String, String>> rateLimited(AiDiagnosticsRateLimitException exception) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, Long.toString(exception.retryAfterSeconds()))
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .header(HttpHeaders.PRAGMA, "no-cache")
            .body(Map.of(
                "error", "RATE_LIMITED",
                "message", "Diagnostics request rate limit exceeded"
            ));
    }

    private Set<String> parseLevels(String levels) {
        if (levels == null || levels.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(levels.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .collect(Collectors.toUnmodifiableSet());
    }
}
