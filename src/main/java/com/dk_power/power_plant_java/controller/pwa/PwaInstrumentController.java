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

import java.util.List;

@RestController
@RequestMapping("/api/pwa/instruments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
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
