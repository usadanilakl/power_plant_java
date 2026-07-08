package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardWalkdownDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PositionOptionsDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.WalkdownSubmitRequest;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoDrawingService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoStandardWalkdownService;
import com.dk_power.power_plant_java.sevice.pwa.PwaLotoStandardWalkdownService.StaleStandardException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Mobile (PWA) access to LOTO Standards for Plant staff.
 *
 * <p>Lives under {@code /api/pwa/secured/**} so it is JWT-authenticated (PwaJwtAuthFilter) and further restricted
 * to ROLE_PLANT/ROLE_ADMIN by a SecurityConfig rule. The PWA JWT principal reliably carries the DB roles.</p>
 *
 * <p>Read: list + detail. Verification/walkdown is <b>offline-first</b>: the client caches a standard + position
 * options, does the checklist locally, and submits once via {@code /walkdown/submit} (evidence + optional
 * transition). The old per-item save endpoints are retired in favour of that batch.</p>
 */
@RestController
@RequestMapping("/api/pwa/secured/loto-standards")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaLotoStandardController {

    private final NgLotoStandardService lotoStandardService;
    private final PwaLotoStandardWalkdownService walkdownService;
    private final PwaLotoDrawingService drawingService;

    // ── Read ──────────────────────────────────────────────────────────────────

    /** All LOTO standards (each with development status + ordered points) for the mobile list. */
    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<LotoStandardDto>>> getAll() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(lotoStandardService.getAllDtos(), "LOTO standards fetched"));
        } catch (Exception e) {
            log.error("[PWA] Failed to fetch LOTO standards: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(List.of(), "Failed to fetch LOTO standards: " + e.getMessage()));
        }
    }

    /** One standard's full detail: points, procedure text, prerequisites, status, attribution. */
    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoStandardDto>> getById(@PathVariable String id) {
        try {
            LotoStandardDto dto = lotoStandardService.getDtoById(id);
            if (dto == null) {
                return ResponseEntity.status(404).body(new NgApiResponse<>(null, "LOTO standard not found"));
            }
            return ResponseEntity.ok(new NgApiResponse<>(dto, "LOTO standard fetched"));
        } catch (Exception e) {
            log.error("[PWA] Failed to fetch LOTO standard {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** Position Value options (isoPos / normPos) for in-field corrections. Cache-able on the client. */
    @GetMapping("/positions")
    public ResponseEntity<NgApiResponse<PositionOptionsDto>> getPositions() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(walkdownService.positionOptions(), "Position options"));
        } catch (Exception e) {
            log.error("[PWA] Failed to fetch position options: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** Any server-side checklist evidence already recorded for a standard (for resuming online). */
    @GetMapping("/{id}/walkdown")
    public ResponseEntity<NgApiResponse<LotoStandardWalkdownDto>> getWalkdown(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(walkdownService.getOrCreate(id), "Walkdown checklist fetched"));
        } catch (Exception e) {
            log.error("[PWA] Failed to fetch walkdown for standard {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    // ── Drawings (per-point file viewer) ──────────────────────────────────────

    /** Per-point drawing descriptors (file id + highlight rectangle) for a standard. Cache-able offline. */
    @GetMapping("/{id}/drawings")
    public ResponseEntity<NgApiResponse<List<PointDrawingDto>>> drawings(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(drawingService.drawingsForStandard(id), "Drawings"));
        } catch (Exception e) {
            log.error("[PWA] Failed to resolve drawings for standard {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Raw JPG bytes of a drawing, for the mobile viewer to cache + render. */
    @GetMapping("/files/{fileId}/image")
    public ResponseEntity<Resource> image(@PathVariable Long fileId) {
        try {
            Resource r = drawingService.imageResource(fileId);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .header("Cache-Control", "max-age=86400")
                    .body(r);
        } catch (Exception e) {
            log.warn("[PWA] Drawing image {} unavailable: {}", fileId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // ── One-shot offline submit ────────────────────────────────────────────────

    /**
     * Submit a whole offline walkdown: apply corrections + record the checklist (its own transaction, always
     * kept if valid), then attempt the requested transition. A rejected transition (role / different-person /
     * status) does NOT discard the checklist — it is reported in {@code transitionMessage}.
     */
    @PostMapping("/{id}/walkdown/submit")
    public ResponseEntity<NgApiResponse<WalkdownSubmitResult>> submit(
            @PathVariable Long id, @RequestBody WalkdownSubmitRequest req) {
        // 1) Evidence — all-or-nothing, but independent of the transition below.
        try {
            walkdownService.saveEvidence(id, req);
        } catch (StaleStandardException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new NgApiResponse<>(null, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[PWA] Walkdown evidence save failed for {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed to save checklist: " + e.getMessage()));
        }

        // 2) Official transition — best-effort; evidence stays regardless.
        boolean transitioned = false;
        String transitionMessage = null;
        LotoStandardDto std;
        String t = req.transition();
        try {
            if ("verify".equalsIgnoreCase(t)) {
                std = walkdownService.verify(id, req.notes());
                transitioned = true;
            } else if ("walkdown".equalsIgnoreCase(t)) {
                std = walkdownService.markWalkdownComplete(id, req.notes());
                transitioned = true;
            } else {
                std = safeDto(id);
            }
        } catch (Exception e) {
            transitionMessage = e.getMessage();
            std = safeDto(id);
        }

        String msg = transitioned ? "Submitted"
                : (transitionMessage != null ? "Checklist saved; not finalized" : "Checklist saved");
        return ResponseEntity.ok(new NgApiResponse<>(new WalkdownSubmitResult(std, transitioned, transitionMessage), msg));
    }

    private LotoStandardDto safeDto(Long id) {
        try {
            return lotoStandardService.getDtoById(String.valueOf(id));
        } catch (Exception e) {
            return null;
        }
    }

    /** Result of an offline submit: latest standard, whether the transition ran, and why not if it didn't. */
    public record WalkdownSubmitResult(LotoStandardDto standard, boolean transitioned, String transitionMessage) {}
}
