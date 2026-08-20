package com.dk_power.power_plant_java.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * States, at every startup, which Maximo path this instance will actually serve — and says so loudly
 * when the answer is "none".
 *
 * <p>The overview used to be served by one of two mutually-exclusive controllers, picked at boot by
 * {@code maximo.source}. A kiosk that was never switched to {@code source=hub} satisfied NEITHER
 * condition, so {@code /ng/maximo/bundle/overview} simply 404'd and the overview widget showed
 * nothing — with no error anywhere explaining why. {@link MaximoOverviewController} now always
 * exists and chooses per request, so a misconfiguration surfaces as a 502 with a reason instead. This
 * still reports it at startup, where an admin will see it before a user does.
 */
@Component
@Slf4j
public class MaximoSourceStartupCheck {

    private final MaximoSourceConfig sourceConfig;

    public MaximoSourceStartupCheck(MaximoSourceConfig sourceConfig) {
        this.sourceConfig = sourceConfig;
    }
    @Value("${maximo.api-key:}")
    private String apiKey;
    @Value("${maximo.hub.url:}")
    private String hubUrl;
    @Value("${hub.kiosk.email:}")
    private String kioskEmail;
    @Value("${hub.kiosk.password:}")
    private String kioskPassword;
    @Value("${sync.server.url:}")
    private String syncServerUrl;

    @EventListener(ApplicationReadyEvent.class)
    public void report() {
        String source = sourceConfig.getSource().name().toLowerCase();
        boolean hubMode = sourceConfig.isHub();
        boolean hasKey = !isBlank(apiKey);

        if (hubMode) {
            String target = !isBlank(hubUrl) ? hubUrl : syncServerUrl;
            if (isBlank(target) || isBlank(kioskEmail) || isBlank(kioskPassword)) {
                log.error("[Maximo] source=hub but the proxy is INCOMPLETE — overview will fail. "
                                + "hub url={} kiosk email={} kiosk password={}. "
                                + "Set maximo.hub.url (public address; the internal 10.x sync URL will not route "
                                + "off-LAN) plus hub.kiosk.email / hub.kiosk.password in application-secrets.properties.",
                        isBlank(target) ? "MISSING" : target,
                        isBlank(kioskEmail) ? "MISSING" : kioskEmail,
                        isBlank(kioskPassword) ? "MISSING" : "set");
            } else {
                log.info("[Maximo] source=hub — overview proxied to {} as {}{}", target, kioskEmail,
                        hasKey ? " (falls back to the local api-key if the hub fails)" : " (no local api-key: no fallback)");
            }
            return;
        }

        if (hasKey) {
            log.info("[Maximo] source={} — calling Maximo directly with the local api-key", source);
            return;
        }

        // Neither path can answer. The overview endpoint now always exists, so this surfaces as a
        // 502 with a reason rather than the silent 404 it used to be — but say so at startup anyway.
        log.error("[Maximo] NO Maximo path can answer on this instance: source={} and maximo.api-key is empty. "
                        + "Set maximo.api-key for the direct path, or switch the source to 'hub' (Settings, or "
                        + "maximo-source.properties) with maximo.hub.url and hub.kiosk.email/password.",
                source);
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}
