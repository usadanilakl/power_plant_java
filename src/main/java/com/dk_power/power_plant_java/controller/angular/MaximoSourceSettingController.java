package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.MaximoSourceConfig;
import com.dk_power.power_plant_java.sevice.maximo.HubKioskMaximoClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Read and change where this machine gets Maximo data.
 *
 * <p>Localhost-only (see SecurityConfigSpring): this changes how the machine it runs on behaves, so
 * only that machine's own Electron shell should be able to set it. It is deliberately NOT under the
 * blanket {@code /ng/config/**} permitAll, which any LAN caller can reach.
 */
@RestController
@RequestMapping("/ng/settings/maximo-source")
@RequiredArgsConstructor
@Slf4j
public class MaximoSourceSettingController {

    private final MaximoSourceConfig sourceConfig;
    private final HubKioskMaximoClient hubClient;

    @Value("${maximo.api-key:}")
    private String apiKey;

    /** Current choice plus whether each option can actually work here, so the UI can explain itself. */
    @GetMapping
    public ResponseEntity<NgApiResponse<Map<String, Object>>> get() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("source", sourceConfig.getSource().name().toLowerCase());
        body.put("localAvailable", apiKey != null && !apiKey.isBlank());
        body.put("hubAvailable", hubClient.isConfigured());
        body.put("hubMissing", hubClient.missingConfig());
        body.put("hubUrl", sourceConfig.getHubUrl());
        body.put("hubEmail", sourceConfig.getHubEmail());
        // Never echo the password back; the UI only needs to know whether one is stored.
        body.put("hubPasswordSet", !sourceConfig.getHubPassword().isBlank());
        // Whether these came from this device's own settings or from the jar's device-config file,
        // so the UI can say "already configured, leave blank" instead of implying they must be typed.
        body.put("hubConfigSource", sourceConfig.isHubConnectionOverridden() ? "device" : "properties");
        return ResponseEntity.ok(new NgApiResponse<>(body, "ok"));
    }

    /**
     * Set the source and/or the hub connection details.
     *
     * <p>Hub URL and credentials are settable here because the machine that most needs them — a
     * kiosk on plant WiFi — cannot edit the jar-baked properties file it would otherwise read them
     * from. Omitted fields are left alone, so the UI can send just {@code source}.
     */
    @PostMapping
    public ResponseEntity<NgApiResponse<Map<String, Object>>> set(@RequestBody Map<String, String> req) {
        if (req == null) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "a body is required"));
        }
        if (req.containsKey("hubUrl") || req.containsKey("hubEmail") || req.containsKey("hubPassword")) {
            String url = req.get("hubUrl");
            if (url != null && !url.isBlank() && !url.startsWith("http://") && !url.startsWith("https://")) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "hubUrl must start with http:// or https://"));
            }
            sourceConfig.setHubConnection(url, req.get("hubEmail"), req.get("hubPassword"));
        }

        String raw = req.get("source");
        if (raw != null) {
            if (!("hub".equalsIgnoreCase(raw) || "local".equalsIgnoreCase(raw))) {
                return ResponseEntity.badRequest()
                        .body(new NgApiResponse<>(null, "source must be 'local' or 'hub'"));
            }
            sourceConfig.setSource("hub".equalsIgnoreCase(raw)
                    ? MaximoSourceConfig.Source.HUB : MaximoSourceConfig.Source.LOCAL);
        }
        // Takes effect on the very next request — no restart, which is the point of moving this
        // off @ConditionalOnProperty.
        return get();
    }

    /**
     * Actually call the hub and report what happened.
     *
     * <p>Without this the only feedback was the overview widget, which renders a failed call and an
     * empty-but-successful one identically ("No work orders for the tracked people") — so a kiosk
     * pointed at an unreachable URL looked exactly like a quiet week.
     */
    @PostMapping("/test")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> test() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("hubUrl", sourceConfig.getHubUrl());
        try {
            var overview = hubClient.overview("leads", 25);
            body.put("ok", true);
            body.put("personCount", overview == null ? 0 : overview.getPersonCount());
            body.put("detail", "Reached the hub and got a response.");
        } catch (Exception e) {
            body.put("ok", false);
            body.put("detail", rootCause(e));
        }
        return ResponseEntity.ok(new NgApiResponse<>(body, "ok"));
    }

    /** The innermost message — "Connection refused" beats a wrapper class name. */
    private static String rootCause(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        String msg = cur.getMessage();
        return (msg == null || msg.isBlank()) ? cur.getClass().getSimpleName() : msg;
    }
}
