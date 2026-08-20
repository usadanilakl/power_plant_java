package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.MaximoSourceConfig;
import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.dto.maximo.MaximoOverviewDto;
import com.dk_power.power_plant_java.sevice.maximo.HubKioskMaximoClient;
import com.dk_power.power_plant_java.sevice.maximo.MaximoBundleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * The Maximo PM overview the Electron widget calls — one endpoint, always present, that decides at
 * REQUEST time whether to answer locally or relay the hub.
 *
 * <p>This replaces a pair of controllers selected by {@code @ConditionalOnProperty} at startup. That
 * arrangement had two problems: the choice could only be changed by editing a file and restarting,
 * and it made a fallback impossible — on a kiosk the local controller did not exist, so there was
 * nothing to fall back to. Deciding per request fixes both, and lets the desktop UI flip the setting.
 *
 * <p>When the source is HUB and the hub cannot answer, this falls back to a direct Maximo call. On a
 * real kiosk that fallback also fails (no api-key, no route to Maximo) and the widget shows nothing —
 * which is the honest outcome, and the same "live-or-nothing" behaviour as before. On a desktop that
 * can do both, it just works.
 */
@RestController
@RequestMapping("/ng/maximo")
@RequiredArgsConstructor
@RestrictedAllowed
@Slf4j
public class MaximoOverviewController {

    private final MaximoSourceConfig sourceConfig;
    private final MaximoBundleService bundles;
    private final HubKioskMaximoClient hubClient;

    @GetMapping("/bundle/overview")
    public ResponseEntity<NgApiResponse<MaximoOverviewDto>> overview(
            @RequestParam(value = "mode", defaultValue = "leads") String mode,
            @RequestParam(value = "personids", required = false) String personids,
            @RequestParam(value = "pageSize", defaultValue = "200") int pageSize) {

        String hubError = null;
        if (sourceConfig.isHub()) {
            try {
                return ResponseEntity.ok(new NgApiResponse<>(hubClient.overview(mode, pageSize), "hub"));
            } catch (Exception e) {
                hubError = rootCause(e);
                log.warn("[Maximo] hub overview failed ({}) — trying a direct Maximo call", hubError);
                // Fall through. A kiosk will fail here too and report it plainly below.
            }
        }

        try {
            MaximoOverviewDto dto = bundles.overview(mode, parseIds(personids), pageSize);
            // Carry the hub failure into the answer. A local result can be perfectly valid AND empty,
            // and the widget renders "no work orders" either way — so a silent fallback made an
            // unreachable hub look exactly like a quiet week.
            String message = hubError == null ? "local" : "local (hub unavailable: " + hubError + ")";
            return ResponseEntity.ok(new NgApiResponse<>(dto, message));
        } catch (Exception e) {
            String detail = hubError != null
                    ? "Hub unreachable (" + hubError + ") and this machine cannot reach Maximo directly"
                    : "Maximo is unavailable";
            log.warn("[Maximo] overview unavailable (source={}): {}", sourceConfig.getSource(), e.getMessage());
            return ResponseEntity.status(502).body(new NgApiResponse<>(null, detail + ": " + rootCause(e)));
        }
    }

    /** The innermost message — "Connection refused" beats a wrapper class name. */
    private static String rootCause(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        String msg = cur.getMessage();
        return (msg == null || msg.isBlank()) ? cur.getClass().getSimpleName() : msg;
    }

    private static List<String> parseIds(String personids) {
        return (personids == null || personids.isBlank())
                ? List.of()
                : Arrays.stream(personids.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
