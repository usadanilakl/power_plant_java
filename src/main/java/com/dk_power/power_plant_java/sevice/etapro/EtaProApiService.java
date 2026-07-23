package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProLogEntry;
import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import java.io.InputStream;
import java.net.Authenticator;
import java.net.HttpURLConnection;
import java.net.PasswordAuthentication;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * EtaPRO REST API client for historian point data — the PRIMARY history source when
 * {@code etapro.api.enabled=true}. Falls back to the Excel scraper (see
 * {@link EtaProHistoryFetchService}) when the API is disabled or a call fails.
 *
 * <p>Uses the historian "interpolated" endpoint (evenly-spaced values over a window), which is the
 * direct analog of the scraper's fixed-interval history grid:
 * <pre>
 * GET {base}/v{version}/{serverName}/{unitDesignation}/points/{pointId}/history/interpolated
 *     ?startTime=&amp;endTime=&amp;timesOffset=&amp;numberOfValues=&amp;tagCategory=Value
 * -&gt; 200 { "PointId": "...", "Values": [ { "Timestamp": "...Z", "Value": &lt;num&gt;, "Quality": 0 } ] }
 * </pre>
 *
 * <p>Time handling: the request window (plant-local) is converted to UTC and sent with
 * {@code timesOffset=0} (the confirmed-working pattern); response Timestamps (UTC/Z) are converted
 * back to plant-local wall-clock via {@code etapro.api.zone} (default America/Chicago), matching the
 * scraper and handling DST (CST/CDT). Base URL / serverName / unitDesignation / version are config.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.api.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProApiService {

    private final ObjectMapper objectMapper;

    /** Base URL of the EtaPRO REST API, no trailing slash (e.g. https://etaproserver:1234). */
    @Value("${etapro.api.base-url:}")
    private String baseUrl;

    @Value("${etapro.api.version:1}")
    private String version;

    @Value("${etapro.api.server-name:}")
    private String serverName;

    @Value("${etapro.api.unit-designation:1}")
    private int unitDesignation;

    /** Hours offset from UTC for the historian's local time (e.g. -5 for CST). Sent as timesOffset. */
    @Value("${etapro.api.times-offset:0}")
    private double timesOffset;

    /** Interpolation resolution — one value every N seconds across the window. */
    @Value("${etapro.api.history.resolution-seconds:60}")
    private int resolutionSeconds;

    /** Hard cap on interpolated values requested per point per call. */
    @Value("${etapro.api.history.max-values:100000}")
    private int maxValues;

    @Value("${etapro.api.tag-category:Value}")
    private String tagCategory;

    /**
     * Which historian collection endpoint to use. "plotvalues" (uses numberOfIntervals — confirmed
     * working on the plant API) or "interpolated" (uses numberOfValues). Same response shape.
     */
    @Value("${etapro.api.history.endpoint:plotvalues}")
    private String historyEndpoint;

    /**
     * Live "current value" endpoint — a single compressed value at-or-before the request time.
     * Confirmed-working on the plant API: {@code history/archivevalue?time=&retrieval=AtOrBefore}.
     */
    @Value("${etapro.api.live.endpoint:archivevalue}")
    private String liveEndpoint;

    @Value("${etapro.api.live.retrieval:AtOrBefore}")
    private String liveRetrieval;

    /** Optional auth header (e.g. name="Authorization", value="Bearer <token>"). Empty = none. */
    @Value("${etapro.api.auth-header-name:}")
    private String authHeaderName;

    @Value("${etapro.api.auth-header-value:}")
    private String authHeaderValue;

    /**
     * Windows Integrated Auth for the IIS-hosted EtaPRO Web API. "transparent" NTLM uses the CURRENT
     * Windows user's credentials (exactly what the browser does on the domain PC):
     * allHosts | trustedHosts | disabled. Effective only on Windows.
     */
    @Value("${etapro.api.ntlm-transparent-auth:allHosts}")
    private String ntlmTransparentAuth;

    /** Explicit credentials (override transparent auth) — e.g. a service account with EtaPRO access. */
    @Value("${etapro.api.auth-user:}")
    private String authUser;
    @Value("${etapro.api.auth-password:}")
    private String authPassword;
    @Value("${etapro.api.auth-domain:}")
    private String authDomain;

    @Value("${etapro.api.timeout-seconds:60}")
    private int timeoutSeconds;

    /**
     * Plant timezone. Used to (a) convert the history window to UTC for the request and (b) convert
     * the API's UTC response timestamps back to plant-local wall-clock — matching the scraper and
     * handling DST (CST/CDT) automatically. Default: Central (Chicago).
     */
    @Value("${etapro.api.zone:America/Chicago}")
    private String zoneName;

    /** EPLog event-log id (path segment). Find it via GET /v{version}/{serverName}/eplog. 0 = unconfigured. */
    @Value("${etapro.api.eplog.event-log-id:0}")
    private long eplogEventLogId;

    /** Max entries per EPLog call. 0 = all (the scraper template was capped at 100; the API can return all). */
    @Value("${etapro.api.eplog.max-rows:0}")
    private int eplogMaxRows;

    @Value("${etapro.api.eplog.hide-deactivated:false}")
    private boolean eplogHideDeactivated;

    @PostConstruct
    void initAuth() {
        // IIS Windows-auth: let HttpURLConnection use the CURRENT Windows user transparently (NTLM) —
        // what the browser does on the domain PC. Effective only on Windows. Set via system property
        // here (also settable as a JVM arg -Djdk.http.ntlm.transparentAuth=... for reliability).
        if (ntlmTransparentAuth != null && !ntlmTransparentAuth.isBlank()) {
            System.setProperty("jdk.http.ntlm.transparentAuth", ntlmTransparentAuth);
        }
        if (authUser != null && !authUser.isBlank()) {
            installCredentialAuthenticator();
        }
        // Startup diagnostics: exactly which Windows account this app process runs as (this is what
        // transparent NTLM authenticates with — if it's a local/SYSTEM account, integrated auth will
        // 401), the target host, and the auth mode in effect.
        log.info("[EtaPro] API client init → host={} authMode={} | process runs as user='{}' domain='{}' ({}) os='{}'",
                hostOf(baseUrl), authModeDesc(),
                System.getProperty("user.name"),
                firstNonBlank(System.getenv("USERDNSDOMAIN"), System.getenv("USERDOMAIN"), "<none>"),
                domainKind(),
                System.getProperty("os.name"));
    }

    /** Human-readable description of which auth mechanism the client will use, for logs. */
    private String authModeDesc() {
        if (authUser != null && !authUser.isBlank()) {
            String u = (authDomain != null && !authDomain.isBlank()) ? authDomain + "\\" + authUser : authUser;
            return "explicit-credentials(" + u + ")";
        }
        if (authHeaderName != null && !authHeaderName.isBlank()) {
            return "static-header(" + authHeaderName + ")";
        }
        return "windows-transparent-ntlm(" + ntlmTransparentAuth + ")";
    }

    /** Is the process's Windows session a domain login (needed for integrated auth) or a local one? */
    private static String domainKind() {
        String dns = System.getenv("USERDNSDOMAIN");   // set only for AD domain logins
        String host = System.getenv("COMPUTERNAME");
        String dom = System.getenv("USERDOMAIN");
        if (dns != null && !dns.isBlank()) return "domain-user";
        if (dom != null && host != null && dom.equalsIgnoreCase(host)) return "LOCAL-account (integrated auth will fail)";
        return "unknown";
    }

    private static String firstNonBlank(String... vals) {
        if (vals != null) for (String v : vals) if (v != null && !v.isBlank()) return v;
        return null;
    }

    // EtaPRO API time format, confirmed from working plant URLs: e.g. "7/21/2026 00:00".
    private static final DateTimeFormatter API_TIME = DateTimeFormatter.ofPattern("M/d/yyyy HH:mm");

    /**
     * Fetch a history series for a set of points over [start, end]. One API call per point;
     * results are concatenated. Throws on any failure so the caller can fall back to the scraper.
     */
    public List<EtaProReading> fetchHistory(List<String> pointIds, LocalDateTime start,
                                            LocalDateTime end, String sessionId) throws Exception {
        return fetchHistory(pointIds, start, end, sessionId, 0);
    }

    /**
     * @param maxPointsOverride if &gt; 0, cap the number of series points per point (for a
     *        chart-friendly trend over a wide window); 0 = use the configured resolution.
     */
    public List<EtaProReading> fetchHistory(List<String> pointIds, LocalDateTime start,
                                            LocalDateTime end, String sessionId, int maxPointsOverride) throws Exception {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("etapro.api.base-url is not configured");
        }
        List<EtaProReading> all = new ArrayList<>();
        int count = maxPointsOverride > 0
                ? Math.max(2, Math.min(maxValues, maxPointsOverride))
                : countFor(start, end);
        for (String pointId : pointIds) {
            if (pointId == null || pointId.isBlank()) continue;
            all.addAll(fetchSeries(pointId.trim(), start, end, count, sessionId));
        }
        return all;
    }

    // ── Live (current value) ───────────────────────────────────

    /**
     * Fetch the current value of each point (the single compressed value at-or-before now) — the API
     * analog of the scraper's Live template. One call per point; points that return no value are
     * skipped. Throws on any failure so the caller can fall back to the scraper.
     */
    public List<EtaProReading> fetchCurrent(List<String> pointIds, String sessionId) throws Exception {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("etapro.api.base-url is not configured");
        }
        LocalDateTime nowLocal = LocalDateTime.now();
        LocalDateTime nowUtc = toUtc(nowLocal);
        List<EtaProReading> all = new ArrayList<>();
        for (String pointId : pointIds) {
            if (pointId == null || pointId.isBlank()) continue;
            EtaProReading r = fetchCurrentValue(pointId.trim(), nowUtc, nowLocal, sessionId);
            if (r != null) all.add(r);
        }
        return all;
    }

    private EtaProReading fetchCurrentValue(String pointId, LocalDateTime atUtc, LocalDateTime nowLocal,
                                            String sessionId) throws Exception {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String endpoint = (liveEndpoint == null || liveEndpoint.isBlank()) ? "archivevalue" : liveEndpoint.trim();
        String url = base
                + "/v" + enc(version)
                + "/" + enc(serverName)
                + "/" + unitDesignation
                + "/points/" + enc(pointId)
                + "/history/" + enc(endpoint)
                + "?time=" + enc(atUtc.format(API_TIME))
                + "&timesOffset=" + timesOffset
                + "&retrieval=" + enc(liveRetrieval)
                + "&tagCategory=" + enc(tagCategory);

        JsonNode root = objectMapper.readTree(httpGet(url, "current " + pointId));
        // Robust to shape: a single value object, a {Values:[...]} wrapper, or a bare array — take newest.
        JsonNode valueNode;
        if (root.isArray()) {
            valueNode = root.size() > 0 ? root.get(root.size() - 1) : root;
        } else if (root.path("Values").isArray() && root.path("Values").size() > 0) {
            JsonNode vs = root.path("Values");
            valueNode = vs.get(vs.size() - 1);
        } else {
            valueNode = root;
        }

        LocalDateTime ts = parseTimestamp(valueNode.path("Timestamp").asText(null));
        JsonNode rawVal = valueNode.path("Value");
        if (rawVal.isMissingNode() || rawVal.isNull()) rawVal = root.path("Value");
        Double val = extractDouble(rawVal);
        if (ts == null && val == null) {
            log.debug("[EtaPro] API current: point={} — no value returned", pointId);
            return null;
        }
        EtaProReading r = new EtaProReading();
        r.setPointId(pointId);
        r.setReadingTime(ts != null ? ts : nowLocal);
        r.setReadingValue(val);
        r.setQuality(valueNode.path("Quality").asInt(0) == 0 ? "Good" : "Bad");
        r.setScrapeSessionId(sessionId);
        log.debug("[EtaPro] API current: point={} value={} at={}", pointId, val, r.getReadingTime());
        return r;
    }

    // ── EPLog (Event Log) ──────────────────────────────────────

    /**
     * Fetch Event Log entries whose Event Time falls in [start, end], mapped to EtaProLogEntry.
     * Requires etapro.api.eplog.event-log-id. Throws on failure so the caller can fall back to the scraper.
     */
    public List<EtaProLogEntry> fetchEpLog(LocalDateTime start, LocalDateTime end, String sessionId) throws Exception {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("etapro.api.base-url is not configured");
        }
        if (eplogEventLogId <= 0) {
            throw new IllegalStateException("etapro.api.eplog.event-log-id is not configured (find it via GET /v"
                    + version + "/" + serverName + "/eplog)");
        }
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        // NB: the EPLog offset param is 'timeOffset' (singular), unlike history's 'timesOffset'.
        String url = base
                + "/v" + enc(version)
                + "/" + enc(serverName)
                + "/eplog/" + eplogEventLogId + "/entries"
                + "?eventStartTime=" + enc(toUtc(start).format(API_TIME))
                + "&eventEndTime=" + enc(toUtc(end).format(API_TIME))
                + "&timeOffset=" + timesOffset
                + "&maxRows=" + eplogMaxRows
                + "&hideDeactivated=" + eplogHideDeactivated;

        JsonNode arr = entriesArray(objectMapper.readTree(httpGet(url, "eplog")));
        List<EtaProLogEntry> entries = new ArrayList<>();
        for (JsonNode e : arr) {
            EtaProLogEntry le = parseEpLogEntry(e, sessionId);
            if (le != null) entries.add(le);
        }
        log.debug("[EtaPro] API EPLog: {} entries", entries.size());
        return entries;
    }

    /** Locate the entries array: top-level array, an Entries/Values wrapper, or a single entry object. */
    private JsonNode entriesArray(JsonNode root) {
        if (root == null) return objectMapper.createArrayNode();
        if (root.isArray()) return root;
        for (String key : new String[]{"Entries", "Values", "entries", "values"}) {
            if (root.path(key).isArray()) return root.get(key);
        }
        if (root.has("EntryIdKey") || root.has("Description")) {
            var single = objectMapper.createArrayNode();
            single.add(root);
            return single;
        }
        return objectMapper.createArrayNode();
    }

    private EtaProLogEntry parseEpLogEntry(JsonNode e, String sessionId) {
        LocalDateTime createTime = parseTimestamp(text(e, "Create Time"));
        String description = text(e, "Description");
        if (description == null && createTime == null) return null; // skip blank rows
        EtaProLogEntry le = new EtaProLogEntry();
        le.setDescription(description);
        le.setArea(text(e, "Event Log Area"));
        le.setLocation(text(e, "Event Log Location"));
        le.setCreatedByName(text(e, "Created By"));
        le.setCreateTime(createTime);
        le.setDeactivatedBy(text(e, "Deactivated By"));
        le.setDeactivateTime(parseTimestamp(text(e, "Deactivate Time")));
        // Crew isn't a first-class field in the API entry; try the custom-attributes bag.
        le.setCrew(text(e.path("Entry Custom Attributes"), "Crew"));
        le.setScrapeSessionId(sessionId);
        // dedupKey left null → engine.saveLogEntries computes the composite so API + scraper dedup identically.
        return le;
    }

    private static String text(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode v = node.path(field);
        if (v.isMissingNode() || v.isNull()) return null;
        String s = v.asText(null);
        return (s == null || s.isBlank()) ? null : s;
    }

    private int countFor(LocalDateTime start, LocalDateTime end) {
        long seconds = Duration.between(start, end).getSeconds();
        if (seconds <= 0) return 2;
        long n = (seconds / Math.max(1, resolutionSeconds)) + 1;
        return (int) Math.max(2, Math.min(maxValues, n));
    }

    private List<EtaProReading> fetchSeries(String pointId, LocalDateTime start,
                                            LocalDateTime end, int count,
                                            String sessionId) throws Exception {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String endpoint = (historyEndpoint == null || historyEndpoint.isBlank()) ? "plotvalues" : historyEndpoint.trim();
        // plotvalues uses numberOfIntervals; interpolated uses numberOfValues.
        String countParam = "interpolated".equalsIgnoreCase(endpoint) ? "numberOfValues" : "numberOfIntervals";
        String url = base
                + "/v" + enc(version)
                + "/" + enc(serverName)
                + "/" + unitDesignation
                + "/points/" + enc(pointId)
                + "/history/" + enc(endpoint)
                + "?startTime=" + enc(toUtc(start).format(API_TIME))
                + "&endTime=" + enc(toUtc(end).format(API_TIME))
                + "&timesOffset=" + timesOffset
                + "&" + countParam + "=" + count
                + "&tagCategory=" + enc(tagCategory);

        JsonNode root = objectMapper.readTree(httpGet(url, "point " + pointId));
        JsonNode values = root.path("Values");
        List<EtaProReading> readings = new ArrayList<>();
        if (values.isArray()) {
            for (JsonNode v : values) {
                LocalDateTime ts = parseTimestamp(v.path("Timestamp").asText(null));
                if (ts == null) continue;
                EtaProReading r = new EtaProReading();
                r.setPointId(pointId);
                r.setReadingTime(ts);
                r.setReadingValue(extractDouble(v.path("Value")));
                r.setQuality(v.path("Quality").asInt(0) == 0 ? "Good" : "Bad");
                r.setScrapeSessionId(sessionId);
                readings.add(r);
            }
        }
        log.debug("[EtaPro] API interpolated: point={}, values={}", pointId, readings.size());
        return readings;
    }

    /** Value is polymorphic in the API; extract a Double when numeric, else null. */
    private Double extractDouble(JsonNode valueNode) {
        if (valueNode == null || valueNode.isNull() || valueNode.isMissingNode()) return null;
        if (valueNode.isNumber()) return valueNode.asDouble();
        if (valueNode.isTextual()) {
            try { return Double.parseDouble(valueNode.asText().trim()); }
            catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    /**
     * Parse the API timestamp (UTC / Z) to plant-local wall-clock in the configured zone, matching
     * the scraper. DST is handled by ZoneId.
     */
    private LocalDateTime parseTimestamp(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return OffsetDateTime.parse(s).toInstant().atZone(zone()).toLocalDateTime();
        } catch (Exception ignored) {
            try { return Instant.parse(s).atZone(zone()).toLocalDateTime(); } catch (Exception ignored2) { }
            try { return LocalDateTime.parse(s); } catch (Exception ignored3) { } // last resort: as-is
            return null;
        }
    }

    /** Convert a plant-local (zone) datetime to a UTC wall-clock datetime for the request. */
    private LocalDateTime toUtc(LocalDateTime local) {
        return local.atZone(zone()).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    private ZoneId zone() {
        try { return ZoneId.of(zoneName); }
        catch (Exception e) { return ZoneId.systemDefault(); }
    }

    /** GET via HttpURLConnection (which — unlike java.net.http.HttpClient — supports Windows NTLM auth). */
    private String httpGet(String url, String ctx) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        try {
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(timeoutSeconds * 1000);
            conn.setRequestProperty("Accept", "application/json");
            if (authHeaderName != null && !authHeaderName.isBlank()) {
                conn.setRequestProperty(authHeaderName, authHeaderValue == null ? "" : authHeaderValue);
            }
            log.debug("[EtaPro] API GET ({}) {}", ctx, url);
            int status = conn.getResponseCode();
            InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();
            String body = (is == null) ? "" : new String(is.readAllBytes(), StandardCharsets.UTF_8);
            if (status < 200 || status >= 300) {
                if (status == 401 || status == 403) {
                    // Auth failure: log the server's challenge scheme (NTLM vs Negotiate/Kerberos) and the
                    // account we authenticated as — this is what diagnoses an integrated-auth mismatch.
                    log.warn("[EtaPro] API {} ({}) AUTH FAILED. server WWW-Authenticate='{}' | client authMode={} runningAs='{}\\{}'. URL={}",
                            status, ctx, conn.getHeaderField("WWW-Authenticate"), authModeDesc(),
                            firstNonBlank(System.getenv("USERDNSDOMAIN"), System.getenv("USERDOMAIN"), "?"),
                            System.getProperty("user.name"), url);
                } else {
                    log.warn("[EtaPro] API {} ({}): {}", status, ctx, truncate(body, 300));
                }
                throw new RuntimeException("EtaPRO API " + status + " (" + ctx + "): " + truncate(body, 300));
            }
            log.debug("[EtaPro] API {} OK ({}) {} bytes", status, ctx, body.length());
            return body;
        } finally {
            conn.disconnect();
        }
    }

    /** Install a host-scoped Authenticator for explicit NTLM/Basic credentials (service account). */
    private void installCredentialAuthenticator() {
        final String host = hostOf(baseUrl);
        final String user = (authDomain != null && !authDomain.isBlank()) ? authDomain + "\\" + authUser : authUser;
        final char[] pass = (authPassword == null ? "" : authPassword).toCharArray();
        Authenticator.setDefault(new Authenticator() {
            @Override protected PasswordAuthentication getPasswordAuthentication() {
                // Only supply EtaPRO credentials for the EtaPRO host; ignore all other hosts.
                if (host != null && host.equalsIgnoreCase(getRequestingHost())) {
                    return new PasswordAuthentication(user, pass);
                }
                return null;
            }
        });
    }

    private static String hostOf(String url) {
        try { return URI.create(url).getHost(); } catch (Exception e) { return null; }
    }

    private static String enc(String s) {
        // URLEncoder encodes space as '+'; the EtaPRO API expects %20 in query values (e.g. dates).
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
