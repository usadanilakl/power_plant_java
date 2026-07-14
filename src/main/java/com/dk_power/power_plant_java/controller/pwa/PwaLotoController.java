package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.loto_permit.PwaLotoDtos.*;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PositionOptionsDto;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoDrawingService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Mobile (PWA) LOTO permit hang / verify / walkdown — under {@code /api/pwa/secured/loto/**} (JWT + ROLE_PLANT/ADMIN).
 * Mirrors the LOTO-Standards PWA surface: read endpoints + positions/drawings, a grab per phase, and one batch submit
 * per flow. Thin proxy over {@link PwaLotoService}; all role/SoD/predecessor gates stay server-authoritative.
 */
@RestController
@RequestMapping("/api/pwa/secured/loto")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaLotoController {

    private final PwaLotoService service;
    private final PwaLotoDrawingService drawingService;

    // ── read ──

    @GetMapping("/list")
    public ResponseEntity<NgApiResponse<List<PwaLotoListItem>>> list() {
        return ok(new NgApiResponse<>(service.list(), "loto permits"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<PwaLotoDetail>> detail(@PathVariable Long id) {
        try {
            return ok(new NgApiResponse<>(service.detail(id), "ok"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/positions")
    public ResponseEntity<NgApiResponse<PositionOptionsDto>> positions() {
        return ok(new NgApiResponse<>(service.positions(), "positions"));
    }

    @GetMapping("/{id}/drawings")
    public ResponseEntity<NgApiResponse<List<PointDrawingDto>>> drawings(@PathVariable Long id) {
        try {
            return ok(new NgApiResponse<>(service.drawings(id), "drawings"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/files/{fileId}/image")
    public ResponseEntity<Resource> image(@PathVariable Long fileId) {
        try {
            Resource r = drawingService.imageResource(fileId);
            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).header("Cache-Control", "max-age=86400").body(r);
        } catch (Exception e) {
            log.warn("[PWA] LOTO drawing image {} unavailable: {}", fileId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // ── grab ──

    @PostMapping("/{id}/grab")
    public ResponseEntity<NgApiResponse<GrabInfo>> grab(@PathVariable Long id, @RequestParam String phase) {
        try {
            return ok(new NgApiResponse<>(service.grab(id, phase), "grabbed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/release")
    public ResponseEntity<NgApiResponse<Void>> release(@PathVariable Long id, @RequestParam String phase) {
        service.release(id, phase);
        return ok(new NgApiResponse<>(null, "released"));
    }

    // ── submit ──

    @PostMapping("/{id}/hang/submit")
    public ResponseEntity<NgApiResponse<PhaseSubmitResult>> submitHang(@PathVariable Long id, @RequestBody HangSubmitRequest body) {
        try {
            return ok(new NgApiResponse<>(service.submitHang(id, body), "hang submitted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/verify/submit")
    public ResponseEntity<NgApiResponse<PhaseSubmitResult>> submitVerify(@PathVariable Long id, @RequestBody VerifySubmitRequest body) {
        try {
            return ok(new NgApiResponse<>(service.submitVerify(id, body), "verify submitted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ── walkdown (repeatable) ──

    @PostMapping("/{id}/walkdown/start")
    public ResponseEntity<NgApiResponse<PwaWalkdownSession>> startWalkdown(@PathVariable Long id, @RequestBody(required = false) WalkdownStartRequest body) {
        try {
            return ok(new NgApiResponse<>(service.startWalkdown(id, body), "walkdown started"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}/walkdown/sessions")
    public ResponseEntity<NgApiResponse<List<PwaWalkdownSession>>> sessions(@PathVariable Long id) {
        return ok(new NgApiResponse<>(service.sessions(id), "sessions"));
    }

    @GetMapping("/walkdown/session/{sessionId}")
    public ResponseEntity<NgApiResponse<PwaWalkdownSession>> session(@PathVariable Long sessionId) {
        try {
            return ok(new NgApiResponse<>(service.getSession(sessionId), "session"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/walkdown/session/{sessionId}/submit")
    public ResponseEntity<NgApiResponse<PwaWalkdownSession>> submitWalkdown(@PathVariable Long sessionId, @RequestBody WalkdownSubmitRequest body) {
        try {
            return ok(new NgApiResponse<>(service.submitWalkdown(sessionId, body), "walkdown submitted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private <T> ResponseEntity<NgApiResponse<T>> ok(NgApiResponse<T> body) {
        return ResponseEntity.ok(body);
    }
}
