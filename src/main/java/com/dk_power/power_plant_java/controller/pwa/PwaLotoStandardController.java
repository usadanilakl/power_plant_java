package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Mobile (PWA) access to LOTO Standards for Plant staff.
 *
 * <p>Lives under {@code /api/pwa/secured/**} so it is JWT-authenticated (PwaJwtAuthFilter), and is
 * further restricted to ROLE_PLANT/ROLE_ADMIN by a SecurityConfig rule. The PWA JWT principal reliably
 * carries the DB roles (unlike the desktop session), so the role check is enforced server-side too.</p>
 *
 * <p>Phase 1: read-only (list + detail), reusing the shared {@link NgLotoStandardService}. Phase 2 adds
 * the per-point verification/walkdown workflow and point-field edits.</p>
 */
@RestController
@RequestMapping("/api/pwa/secured/loto-standards")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaLotoStandardController {

    private final NgLotoStandardService lotoStandardService;

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
}
