package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaInsulationItemDto;
import com.dk_power.power_plant_java.sevice.pwa.PwaInsulationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * PWA endpoints for insulation contractors. Access is gated by SecurityConfig to
 * {@code ROLE_INSULATION}, {@code ROLE_PLANT}, or {@code ROLE_ADMIN} on
 * {@code /api/pwa/secured/insulation/**} — plant supervisors can see the same queue.
 *
 * Two operations only:
 *   GET  /active       — list of active insulation WOs across the plant
 *   POST /{id}/complete — mark done, COMPs the Maximo WO
 *
 * Deliberately minimal — contractors don't submit new field lists (that path lives
 * at {@code /api/pwa/field-list-item/**}, gated to PLANT+ADMIN only).
 */
@RestController
@RequestMapping("/api/pwa/secured/insulation")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaInsulationController {

    private final PwaInsulationService insulationService;

    @GetMapping("/active")
    public ResponseEntity<NgApiResponse<List<PwaInsulationItemDto>>> listActive() {
        try {
            List<PwaInsulationItemDto> items = insulationService.listActive();
            return ResponseEntity.ok(new NgApiResponse<>(items,
                    "Active insulation items: " + items.size()));
        } catch (Exception e) {
            log.error("[PwaInsulation] listActive failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Failed to load: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<NgApiResponse<Boolean>> markComplete(@PathVariable Long id) {
        try {
            boolean ok = insulationService.markComplete(id, currentUserHandle());
            return ResponseEntity.ok(new NgApiResponse<>(ok, ok
                    ? "WO closed"
                    : "Could not close WO — see hub logs"));
        } catch (Exception e) {
            log.error("[PwaInsulation] markComplete id={} failed: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(false, "Failed to complete: " + e.getMessage()));
        }
    }

    /**
     * Best-effort attribution — used in the memo passed to Maximo's changeStatus. Returns null
     * if security context is empty (shouldn't happen inside /secured but defensive since a
     * SecurityContext holder call can theoretically return null).
     */
    private static String currentUserHandle() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || a.getName() == null || a.getName().isBlank()) return null;
        return a.getName();
    }
}
