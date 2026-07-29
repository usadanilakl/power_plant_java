package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.maximo.MaximoOverviewDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.Map;

/**
 * Kiosk-only client that fetches the Maximo PM overview from the HUB on behalf of a device that can't reach
 * Maximo directly (e.g. a display kiosk on plant WiFi). It authenticates server-to-server with a dedicated
 * read-only kiosk account (ROLE_KIOSK) against the hub's Plant-gated PWA endpoint, caching the long-lived hub
 * JWT and re-logging-in on expiry or a 401/403.
 *
 * <p>Active only when {@code maximo.source=hub} (the kiosk profile). A normal desktop/hub leaves this off and
 * calls Maximo directly. The credential lives entirely in the backend (never the renderer), and the account is
 * read-only, so a leaked token can only view the overview.
 *
 * <p>Live-or-nothing: any failure (hub unreachable, bad creds) propagates so the caller shows nothing rather
 * than stale/estimated data.
 */
@Service
@ConditionalOnProperty(name = "maximo.source", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubKioskMaximoClient {

    private final RestTemplate restTemplate;
    private final SyncConfig syncConfig;

    /** Public hub base URL (e.g. https://jgportal.jpowerusa.com). Falls back to sync.server.url when blank. */
    @Value("${maximo.hub.url:}")
    private String hubUrlConfig;
    @Value("${hub.kiosk.email:}")
    private String kioskEmail;
    @Value("${hub.kiosk.password:}")
    private String kioskPassword;

    /** Refresh the token this many seconds before its stated expiry, to avoid using an about-to-expire token. */
    private static final long SKEW_SECONDS = 300;

    private volatile String token;
    private volatile Instant tokenExpiry = Instant.EPOCH;

    /**
     * The PM overview, fetched live from the hub. {@code mode} is coerced to the hub's lead-scoped PM view.
     * Throws on hub failure / auth failure — the controller turns that into a blank widget (never stale data).
     */
    public MaximoOverviewDto overview(String mode, int pageSize) {
        try {
            return fetchOverview(bearer(false), mode, pageSize);
        } catch (HttpClientErrorException.Unauthorized | HttpClientErrorException.Forbidden e) {
            // Cached token was rejected — force a fresh login and retry exactly once.
            log.warn("[Kiosk] hub overview returned {} — re-authenticating and retrying once", e.getStatusCode());
            return fetchOverview(bearer(true), mode, pageSize);
        }
    }

    private MaximoOverviewDto fetchOverview(String bearer, String mode, int pageSize) {
        String url = UriComponentsBuilder
                .fromHttpUrl(hubUrl() + "/api/pwa/secured/maximo/bundle/overview")
                .queryParam("mode", "mine".equals(mode) ? "mine" : "leads")
                .queryParam("pmOnly", true)
                .queryParam("pageSize", pageSize)
                .toUriString();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearer);
        ResponseEntity<NgApiResponse<MaximoOverviewDto>> resp = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers), new ParameterizedTypeReference<>() {});
        return resp.getBody() == null ? null : resp.getBody().getResponseData();
    }

    /** Cached hub JWT for the kiosk account; logs in when missing/expired or when {@code force} is set. */
    private synchronized String bearer(boolean force) {
        if (!force && token != null && Instant.now().isBefore(tokenExpiry)) return token;
        if (isBlank(kioskEmail) || isBlank(kioskPassword)) {
            throw new IllegalStateException("hub.kiosk.email / hub.kiosk.password must be set when maximo.source=hub");
        }
        String url = hubUrl() + "/api/pwa/auth/login";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, String> body = Map.of("email", kioskEmail, "password", kioskPassword);
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
        Map<?, ?> b = resp.getBody();
        if (b == null || b.get("token") == null) throw new IllegalStateException("hub login returned no token");
        token = String.valueOf(b.get("token"));
        long expiresIn = (b.get("expiresIn") instanceof Number n) ? n.longValue() : 3600L;
        tokenExpiry = Instant.now().plusSeconds(Math.max(60L, expiresIn - SKEW_SECONDS));
        log.info("[Kiosk] obtained hub JWT for {} (expires in ~{}s)", kioskEmail, expiresIn);
        return token;
    }

    private String hubUrl() {
        String url = !isBlank(hubUrlConfig) ? hubUrlConfig : syncConfig.getSyncServerUrl();
        if (isBlank(url)) throw new IllegalStateException("maximo.hub.url (or sync.server.url) is not configured");
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}
