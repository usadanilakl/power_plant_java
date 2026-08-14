package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaInstrumentStateDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.sevice.pwa.PwaInstrumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * Instrument register for the PWA. Sits under {@code /api/pwa/secured/**} (JWT required) and is
 * further gated to ROLE_INSTRUMENTATION / ROLE_ADMIN by SecurityConfig — the register is plant
 * equipment data, not an open submission endpoint like work-request/JHA.
 */
@RestController
@RequestMapping("/api/pwa/secured/instruments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaInstrumentController {

    private final PwaInstrumentService pwaService;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<InstrumentDto>>> getAll() {
        try {
            List<InstrumentDto> instruments = pwaService.getAllInstruments();
            return ResponseEntity.ok(new NgApiResponse<>(instruments, "Instruments fetched successfully"));
        } catch (Exception e) {
            log.error("[PWA] Failed to fetch instruments: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(List.of(), "Failed to fetch instruments: " + e.getMessage()));
        }
    }

    /**
     * Incremental register sync. {@code since} is an ISO-8601 offset timestamp the client got from a
     * previous {@code /state} call ({@code lastModified}) — never a client clock reading, so there is
     * no skew to compensate for. Returns only the instruments touched at or after it.
     *
     * <p>A malformed or missing cursor falls back to the full register rather than erroring: the
     * caller's alternative is a full pull anyway, and failing the request would leave a phone with a
     * stale list for no benefit.</p>
     */
    @GetMapping("/changes")
    public ResponseEntity<NgApiResponse<List<InstrumentDto>>> changes(
            @RequestParam(required = false) String since) {
        try {
            LocalDateTime cursor = parseCursor(since);
            List<InstrumentDto> changed = pwaService.getInstrumentsChangedSince(cursor);
            log.info("[PWA] Instrument delta since={} -> {} rows", since, changed.size());
            return ResponseEntity.ok(new NgApiResponse<>(changed, "Instrument changes fetched successfully"));
        } catch (Exception e) {
            log.error("[PWA] Failed to fetch instrument changes since {}: {}", since, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(List.of(), "Failed to fetch instrument changes: " + e.getMessage()));
        }
    }

    private static LocalDateTime parseCursor(String since) {
        if (since == null || since.isBlank()) return null;
        try {
            // /state emits UTC ISO_OFFSET_DATE_TIME; entity timestamps are naive UTC LocalDateTime.
            return OffsetDateTime.parse(since).atZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        } catch (DateTimeParseException offsetMiss) {
            try {
                return LocalDateTime.parse(since);
            } catch (DateTimeParseException naiveMiss) {
                log.warn("[PWA] Unparseable instrument delta cursor '{}' — serving the full register", since);
                return null;
            }
        }
    }

    @GetMapping("/state")
    public ResponseEntity<NgApiResponse<PwaInstrumentStateDto>> state() {
        try {
            PwaInstrumentStateDto state = pwaService.getInstrumentsState();
            return ResponseEntity.ok(new NgApiResponse<>(state, "Instrument state fetched successfully"));
        } catch (Exception e) {
            log.error("[PWA] Failed to fetch instrument state: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Failed to fetch instrument state: " + e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> create(
            @RequestBody InstrumentDto dto) {
        try {
            log.info("[PWA] Received instrument creation: tagNumber={}", dto.getTagNumber());
            PwaSubmissionResult result = pwaService.createInstrument(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Instrument creation processed"));
        } catch (Exception e) {
            log.error("[PWA] Instrument creation failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Creation failed: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
