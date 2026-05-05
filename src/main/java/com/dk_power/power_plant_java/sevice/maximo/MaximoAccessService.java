package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.config.MaximoConfig;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class MaximoAccessService {

    private final MaximoConfig config;

    @Qualifier("maximoRestTemplate")
    private final RestTemplate restTemplate;

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
        return b.build(true).toUri();
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

    /** Multipart upload to a doclinks-style sub-collection. body is a MultiValueMap with "doc" file part + meta fields. */
    public Map<String, Object> postMultipart(String url, HttpEntity<?> multipartEntity) {
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    URI.create(url), HttpMethod.POST, multipartEntity,
                    new ParameterizedTypeReference<>() {});
            return resp.getBody();
        } catch (HttpClientErrorException e) {
            log.warn("[Maximo] multipart POST {} failed: {} {}", url, e.getStatusCode(), e.getResponseBodyAsString());
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

    public String defaultSite() {
        return config.getDefaultSite();
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        return h;
    }
}
