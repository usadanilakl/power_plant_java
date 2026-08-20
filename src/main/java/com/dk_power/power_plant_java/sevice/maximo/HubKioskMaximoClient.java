package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.config.MaximoSourceConfig;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.maximo.MaximoOverviewDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * <p>Used when the Maximo source is set to the hub (Settings, or {@code maximo.source}). Otherwise unused —
 * calls Maximo directly. The credential lives entirely in the backend (never the renderer), and the account is
 * read-only, so a leaked token can only view the overview.
 *
 * <p>Live-or-nothing: any failure (hub unreachable, bad creds) propagates so the caller shows nothing rather
 * than stale/estimated data.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HubKioskMaximoClient {

    private final RestTemplate restTemplate;
    /**
     * Connection settings come from here, not from @Value, so a kiosk can be pointed at the PUBLIC
     * hub URL from its own Settings page. The credentials used to be readable only from a properties
     * file baked into the jar, which meant a kiosk in the field could select the hub but never
     * actually configure it.
     */
    private final MaximoSourceConfig sourceConfig;

    /** Refresh the token this many seconds before its stated expiry, to avoid using an about-to-expire token. */
    private static final long SKEW_SECONDS = 300;

    private volatile String token;
    private volatile Instant tokenExpiry = Instant.EPOCH;

    /** Whether this client could actually reach the hub if asked — used to explain a dead toggle. */
    public boolean isConfigured() {
        return !isBlank(sourceConfig.getHubUrl())
                && !isBlank(sourceConfig.getHubEmail())
                && !isBlank(sourceConfig.getHubPassword());
    }

    /** What is missing, for a UI that has to tell someone why the hub option will not work. */
    public String missingConfig() {
        StringBuilder sb = new StringBuilder();
        if (isBlank(sourceConfig.getHubUrl())) sb.append("hub URL ");
        if (isBlank(sourceConfig.getHubEmail())) sb.append("hub account email ");
        if (isBlank(sourceConfig.getHubPassword())) sb.append("hub account password ");
        return sb.toString().trim();
    }

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
        String email = sourceConfig.getHubEmail();
        String password = sourceConfig.getHubPassword();
        if (isBlank(email) || isBlank(password)) {
            throw new IllegalStateException("the Maximo source is set to the hub, but the hub account "
                    + "email/password are not set (Settings > Maximo Data Source)");
        }
        String url = hubUrl() + "/api/pwa/auth/login";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, String> body = Map.of("email", email, "password", password);
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
        Map<?, ?> b = resp.getBody();
        if (b == null || b.get("token") == null) throw new IllegalStateException("hub login returned no token");
        token = String.valueOf(b.get("token"));
        long expiresIn = (b.get("expiresIn") instanceof Number n) ? n.longValue() : 3600L;
        tokenExpiry = Instant.now().plusSeconds(Math.max(60L, expiresIn - SKEW_SECONDS));
        log.info("[Kiosk] obtained hub JWT for {} (expires in ~{}s)", email, expiresIn);
        return token;
    }

    /**
     * The hub base URL. A kiosk on plant WiFi must use the PUBLIC address — the internal 10.x sync
     * URL does not route there — so this never silently falls back to sync.server.url.
     */
    private String hubUrl() {
        String url = sourceConfig.getHubUrl();
        if (isBlank(url)) {
            throw new IllegalStateException("the hub URL is not configured (Settings > Maximo Data "
                    + "Source). Use the public address, e.g. https://jgportal.jpowerusa.com");
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}
