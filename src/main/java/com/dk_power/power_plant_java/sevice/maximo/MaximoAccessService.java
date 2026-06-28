package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.config.MaximoConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
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

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Thin facade for all Maximo OSLC API communication.
 * Handles base URL, auth, and JSON marshalling. Entity-specific operations live in adapters
 * (MaximoAssetAdapter, MaximoServiceRequestAdapter, MaximoWorkOrderAdapter, MaximoDoclinksAdapter).
 */
@Slf4j
@Service
public class MaximoAccessService {

    private final MaximoConfig config;
    private final RestTemplate restTemplate;

    // Explicit constructor so @Qualifier on the parameter is honored. With @RequiredArgsConstructor,
    // Lombok generates a constructor whose parameter has no @Qualifier, so Spring would inject the
    // wrong RestTemplate bean (e.g. sharepointRestTemplate) and Maximo returns 401 BMXAA0021E
    // because no apikey header is attached.
    public MaximoAccessService(MaximoConfig config,
                               @Qualifier("maximoRestTemplate") RestTemplate restTemplate) {
        this.config = config;
        this.restTemplate = restTemplate;
    }

    /** Absolute URL for an OSLC object structure (e.g. "mxasset" -> ".../oslc/os/mxasset"). */
    public String osUrl(String objectStructure) {
        return config.getBaseUrl() + "/oslc/os/" + objectStructure;
    }

    /** Absolute URL for a sub-collection on a specific resource (e.g. asset doclinks). */
    public String subUrl(String objectStructure, String href, String collection) {
        return osUrl(objectStructure) + "/" + href + "/" + collection;
    }

    /** Build a URI with OSLC-style query params. Null/blank values are skipped. */
    public URI buildUri(String url, Map<String, String> params) {
        UriComponentsBuilder b = UriComponentsBuilder.fromHttpUrl(url);
        if (params != null) {
            params.forEach((k, v) -> {
                if (v != null && !v.isBlank()) b.queryParam(k, v);
            });
        }
        return b.encode().build().toUri();
    }

    /** GET returning the body as Map (top-level OSLC envelope). */
    public Map<String, Object> getMap(String url, Map<String, String> params) {
        URI uri = buildUri(url, params);
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(jsonHeaders()),
                    new ParameterizedTypeReference<>() {});
            return resp.getBody();
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] GET {} failed: {} {}", uri, e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }

    /**
     * GET every page of an OSLC collection by looping {@code pageno=1,2,…} and merging
     * {@code rdfs:member} across pages, stopping when a page returns fewer than {@code pageSize}
     * members (the last page) or {@code maxPages} is hit (safety valve).
     *
     * Needed because {@link #getMap} returns only the first page — a large query (e.g. a year of PM
     * work orders across all leads) would otherwise be SILENTLY truncated. Pass a stable
     * {@code -spi:field} orderBy in {@code params} so rows don't shuffle between page fetches.
     */
    public List<Map<String, Object>> getAllMembers(String url, Map<String, String> params,
                                                   int pageSize, int maxPages) {
        int ps = Math.max(1, pageSize);
        int cap = Math.max(1, maxPages);
        List<Map<String, Object>> all = new ArrayList<>();
        for (int page = 1; page <= cap; page++) {
            Map<String, String> p = new LinkedHashMap<>();
            if (params != null) p.putAll(params);
            p.put("oslc.pageSize", Integer.toString(ps));
            p.put("pageno", Integer.toString(page));
            List<Map<String, Object>> members =
                    com.dk_power.power_plant_java.sevice.maximo.MaximoOslcMapper.members(getMap(url, p));
            all.addAll(members);
            if (members.size() < ps) break; // short/empty page => done
            if (page == cap) {
                log.warn("[Maximo] getAllMembers hit maxPages={} for {} (pageSize={}) — result may be truncated",
                        cap, url, ps);
            }
        }
        return all;
    }

    /** POST a JSON body, return body as Map. Sends "Properties: *" so Maximo returns the created/updated record. */
    public Map<String, Object> postJson(String url, Map<String, String> params, Object body) {
        URI uri = buildUri(url, params);
        HttpHeaders h = jsonHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("Properties", "*");
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    uri, HttpMethod.POST, new HttpEntity<>(body, h),
                    new ParameterizedTypeReference<>() {});
            return resp.getBody();
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] POST {} failed: {} {}", uri, e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }

    /**
     * Add child rows to an existing resource (e.g. labor/worklog/material on a work order).
     * POST the parent resource URL with {@code x-method-override: PATCH} + {@code patchtype: MERGE}.
     *
     * Verified against this Maximo instance (see memory reference_maximo_write_api):
     *   - {@code x-method-override} is required — the older {@code X-HTTP-Method} header returns
     *     400 {@code oslc#create_on_updateuri}.
     *   - {@code patchtype: MERGE} is ADDITIVE: it key-matches child rows by their id, so a new row
     *     WITHOUT a primary key is appended and existing rows are left untouched. This is what we want.
     *   - {@code patchtype: AddChange} REPLACES the collection (deletes rows not in the payload) — it
     *     destroys a pre-existing worklog and 400s ({@code BMXAA1872E}) on a WO with posted material,
     *     because issue transactions cannot be deleted. Do NOT use it for incremental adds.
     *   - The child array key AND every field must be {@code spi:}-prefixed; unprefixed keys are silently dropped.
     * Returns the response body (often null/empty — Maximo answers 204 on success).
     */
    public Map<String, Object> addChildren(String resourceUrl, Object body) {
        HttpHeaders h = jsonHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("x-method-override", "PATCH");
        h.set("patchtype", "MERGE");
        h.set("Properties", "*");
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    URI.create(resourceUrl), HttpMethod.POST, new HttpEntity<>(body, h),
                    new ParameterizedTypeReference<>() {});
            return resp.getBody();
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] addChildren {} failed: {} {}", resourceUrl, e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }

    /**
     * Invoke an MBO action method (e.g. {@code wsmethod:changeStatus}) on an existing resource.
     * POST {@code <resourceUrl>?action=<action>} with {@code x-method-override: PATCH}. The body
     * carries the method's parameters by name (e.g. {@code {"status":"COMP","memo":"..."}}) — these
     * are NOT spi-prefixed because they are method params, not MBO attributes. Maximo answers 204 on success.
     */
    public Map<String, Object> invokeAction(String resourceUrl, String action, Object body) {
        URI uri = UriComponentsBuilder.fromHttpUrl(resourceUrl)
                .queryParam("action", action).encode().build().toUri();
        HttpHeaders h = jsonHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("x-method-override", "PATCH");
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    uri, HttpMethod.POST, new HttpEntity<>(body, h),
                    new ParameterizedTypeReference<>() {});
            return resp.getBody();
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] action {} on {} failed: {} {}", action, resourceUrl, e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }

    /**
     * POST raw binary bytes (e.g. a file) and return the full ResponseEntity so callers can
     * read response headers like Location. Used for doclink uploads — Maximo's multipart
     * endpoint NPEs on this instance, but the OSLC binary-body upload works:
     *   Content-Type: <file mime>; slug: <filename>; x-document-meta: <doctype>; body = bytes.
     */
    public ResponseEntity<Void> postBinary(String url, byte[] bytes, HttpHeaders headers) {
        try {
            return restTemplate.exchange(
                    URI.create(url), HttpMethod.POST, new HttpEntity<>(bytes, headers), Void.class);
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] binary POST {} failed: {} {}", url, e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }

    /** GET raw bytes (for downloading attachments). */
    public byte[] getBytes(String url) {
        try {
            ResponseEntity<byte[]> resp = restTemplate.exchange(
                    URI.create(url), HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);
            return resp.getBody();
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] GET bytes {} failed: {} {}", url, e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }

    /** GET binary along with the response headers so the proxy can forward Content-Type / Content-Length / Content-Disposition. */
    public ResponseEntity<byte[]> getBinaryWithHeaders(String url) {
        try {
            return restTemplate.exchange(
                    URI.create(url), HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] GET binary {} failed: {} {}", url, e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }

    public String defaultSite() {
        return config.getDefaultSite();
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        return h;
    }
}
