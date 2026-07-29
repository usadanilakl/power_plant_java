package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.maximo.MaximoOverviewDto;
import com.dk_power.power_plant_java.sevice.maximo.HubKioskMaximoClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Kiosk overview proxy. On a device configured {@code maximo.source=hub} (a display kiosk whose own network
 * can't reach Maximo, and which therefore has NO local {@code maximo.api-key}), the real {@link NgMaximoController}
 * is absent. This serves the SAME local path the Electron overview widget already calls
 * ({@code /ng/maximo/bundle/overview}) by forwarding to the hub's Plant-gated PWA overview with a read-only
 * kiosk JWT (see {@link HubKioskMaximoClient}). No Electron/frontend change is needed.
 *
 * <p>Live-or-nothing: if the hub can't answer, this returns 502 so the widget shows nothing — never stale or
 * schedule-estimated data.
 *
 * <p>Mutually exclusive with {@link NgMaximoController} by {@code maximo.source}: this controller is active when
 * {@code maximo.source=hub}, and NgMaximoController is disabled for {@code source=hub} (it now also requires
 * {@code source!=hub}). So a kiosk can run the SAME shared jar — the baked-in {@code maximo.api-key} is simply
 * unused — with no double-mapping of {@code /bundle/overview}.
 */
@RestController
@RequestMapping("/ng/maximo")
@ConditionalOnProperty(name = "maximo.source", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class KioskMaximoOverviewController {

    private final HubKioskMaximoClient hub;

    @GetMapping("/bundle/overview")
    public ResponseEntity<NgApiResponse<MaximoOverviewDto>> overview(
            @RequestParam(value = "mode", defaultValue = "leads") String mode,
            // Accepted for signature-compatibility with the desktop endpoint; the hub PM overview is
            // lead-scoped (pmOnly), so a kiosk's tracked-people list isn't forwarded.
            @RequestParam(value = "personids", required = false) String personids,
            @RequestParam(value = "pageSize", defaultValue = "200") int pageSize) {
        try {
            MaximoOverviewDto ov = hub.overview(mode, pageSize);
            return ResponseEntity.ok(new NgApiResponse<>(ov, "ok"));
        } catch (Exception e) {
            log.warn("[Kiosk] overview proxy to hub failed: {}", e.getMessage());
            return ResponseEntity.status(502).body(new NgApiResponse<>(null, "Hub unavailable: " + e.getMessage()));
        }
    }
}
