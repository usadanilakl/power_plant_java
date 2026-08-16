package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaFieldListDriftStatusDto;
import com.dk_power.power_plant_java.sevice.pwa.PwaFieldListDriftService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Read-only drift signals for the PWA. Field workers (plant users + insulation contractors)
 * get a badge on their row list so they can escalate to admin; resolution lives in the JG
 * Portal admin drift panel — this endpoint has no accept / retry actions.
 *
 * <p>Path lives under {@code /api/pwa/secured/field-list-drift/**}, gated INSULATION + PLANT
 * + ADMIN in {@code SecurityConfigSpring} — the broadest of the field-list-related roles so
 * both submitter (PLANT) and contractor (INSULATION) get the badge.
 */
@RestController
@RequestMapping("/api/pwa/secured/field-list-drift")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {
        "https://dk-power.github.io",
        "https://jacksongeneration.github.io",
        "http://localhost:*",
        "http://127.0.0.1:*"
}, allowCredentials = "true")
public class PwaFieldListDriftController {

    private final PwaFieldListDriftService service;

    /**
     * Drift status for a list of row ids (empty body / missing ids → empty map). Returns a
     * DTO per id even when there's no drift so the client always finds a key it can render.
     */
    @PostMapping("/status")
    public ResponseEntity<NgApiResponse<Map<Long, PwaFieldListDriftStatusDto>>> status(
            @RequestBody(required = false) List<Long> ids) {
        try {
            Map<Long, PwaFieldListDriftStatusDto> out = service.statusFor(ids == null ? List.of() : ids);
            return ResponseEntity.ok(new NgApiResponse<>(out, "Drift status for " + out.size() + " row(s)"));
        } catch (Exception e) {
            log.warn("[PWA FieldList Drift] status lookup failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(Map.of(), "Drift lookup failed: " + e.getMessage()));
        }
    }
}
