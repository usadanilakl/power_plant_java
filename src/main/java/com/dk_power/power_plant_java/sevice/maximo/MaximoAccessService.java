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

    /** OSLC-style update — POST with X-HTTP-Method: PATCH, patchtype=MERGE. */
    public Map<String, Object> patchJson(String url, Object body) {
        HttpHeaders h = jsonHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("X-HTTP-Method", "PATCH");
        h.set("patchtype", "MERGE");
        h.set("Properties", "*");
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    URI.create(url), HttpMethod.POST, new HttpEntity<>(body, h),
                    new ParameterizedTypeReference<>() {});
            return resp.getBody();
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] PATCH {} failed: {} {}", url, e.getStatusCode(), e.getResponseBodyAsString());
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
