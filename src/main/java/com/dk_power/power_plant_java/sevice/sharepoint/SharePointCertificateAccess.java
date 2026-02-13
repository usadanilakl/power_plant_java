package com.dk_power.power_plant_java.sevice.sharepoint;

import com.azure.core.credential.AccessToken;
import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.ClientCertificateCredential;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Component
public class SharePointCertificateAccess implements SharePointAccess {

    private ClientCertificateCredential credential;
    private RestTemplate restTemplate;

    @Value("${sharepoint.azure.scopes:}")
    private String scopes;

    @Value("${sharepoint.site.hostname:}")
    private String siteHostname;

    @Value("${sharepoint.site.path:}")
    private String sitePath;

    private String siteUrl;
    private String accessToken;
    private Instant tokenExpirationTime;
    private boolean available = false;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SharePointCertificateAccess() {
        log.info("[SharePoint] SharePointCertificateAccess created (no credential bean)");
    }

    @Autowired(required = false)
    public SharePointCertificateAccess(
            ClientCertificateCredential credential,
            @Qualifier("sharepointRestTemplate") RestTemplate restTemplate) {
        this.credential = credential;
        this.restTemplate = restTemplate;
        log.info("[SharePoint] SharePointCertificateAccess created with credential + RestTemplate");
    }

    @PostConstruct
    public void init() {
        if (credential == null) {
            log.warn("[SharePoint] No ClientCertificateCredential bean. Certificate access disabled.");
            return;
        }
        this.siteUrl = "https://" + siteHostname + sitePath;
        log.info("[SharePoint] Site URL: {}", siteUrl);

        try {
            authenticate();
            ResponseEntity<String> response = sendGetRequest("/_api/web/title");
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[SharePoint] Connection verified. Response: {}", response.getBody());
                this.available = true;
                log.info("[SharePoint] SharePointCertificateAccess initialized successfully");
            } else {
                log.warn("[SharePoint] Connection test failed with status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.warn("[SharePoint] Initialization failed: {}. Will fall back to PowerAutomate.", e.getMessage());
            this.available = false;
        }
    }

    // ====================== Generic list methods (used by adapters) ======================

    public List<JsonNode> getListItems(String listTitle) {
        ResponseEntity<String> response = sendGetRequest(
                "/_api/web/lists/getbytitle('" + listTitle + "')/items?$top=5000"
        );
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.has("value") ? root.path("value") : root.path("d").path("results");
            List<JsonNode> result = new ArrayList<>();
            for (JsonNode item : items) {
                result.add(item);
            }
            log.debug("[SharePoint] Fetched {} items from '{}'", result.size(), listTitle);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse items from list '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public String createListItem(String listTitle, Map<String, Object> body) {
        String endpoint = "/_api/web/lists/getbytitle('" + listTitle + "')/items";
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            log.info("[SharePoint] Creating item in '{}': {}", listTitle, jsonBody);

            ResponseEntity<String> response = sendPostRequest(endpoint, jsonBody);
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String id = root.has("ID") ? root.path("ID").asText(null) : root.path("d").path("ID").asText(null);
                log.info("[SharePoint] Created item in '{}' with ID: {}", listTitle, id);
                return id;
            } else {
                throw new RuntimeException("SharePoint create failed: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[SharePoint] Failed to create item in '{}': {}", listTitle, e.getMessage());
            throw new RuntimeException("Failed to create item in list '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public void updateListItem(String listTitle, String itemId, Map<String, Object> body) {
        String endpoint = "/_api/web/lists/getbytitle('" + listTitle + "')/items(" + itemId + ")";
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            sendMergeRequest(endpoint, jsonBody);
            log.debug("[SharePoint] Updated item {} in '{}'", itemId, listTitle);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update item " + itemId + " in list '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public void addListItemAttachment(String listTitle, String itemId, String fileName, byte[] content) {
        String endpoint = String.format(
                "/_api/web/lists/getbytitle('%s')/items(%s)/AttachmentFiles/add(FileName='%s')",
                listTitle, itemId, fileName);

        String fullUrl = siteUrl + endpoint;
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        HttpEntity<byte[]> entity = new HttpEntity<>(content, headers);

        ResponseEntity<String> response = restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful()) {
            log.info("[SharePoint] Attachment '{}' uploaded to {} in '{}'", fileName, itemId, listTitle);
        } else {
            throw new RuntimeException("Failed to upload attachment: " + response.getStatusCode());
        }
    }

    // ====================== Auth & HTTP ======================

    private void authenticate() {
        TokenRequestContext tokenRequestContext = new TokenRequestContext();
        tokenRequestContext.addScopes(scopes.split(","));

        AccessToken token = credential.getToken(tokenRequestContext).block();
        if (token != null) {
            this.accessToken = token.getToken();
            this.tokenExpirationTime = token.getExpiresAt().toInstant();
            log.debug("[SharePoint] Token acquired, expires at {}", tokenExpirationTime);
        } else {
            throw new RuntimeException("Failed to acquire SharePoint access token");
        }
    }

    private void ensureValidToken() {
        if (tokenExpirationTime == null || Instant.now().isAfter(tokenExpirationTime.minus(Duration.ofMinutes(5)))) {
            authenticate();
        }
    }

    private HttpHeaders createHeaders() {
        ensureValidToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json;odata=nometadata");
        return headers;
    }

    private ResponseEntity<String> sendGetRequest(String endpoint) {
        String fullUrl = siteUrl + endpoint;
        HttpEntity<?> entity = new HttpEntity<>(createHeaders());
        return restTemplate.exchange(fullUrl, HttpMethod.GET, entity, String.class);
    }

    private ResponseEntity<String> sendPostRequest(String endpoint, Object body) {
        String fullUrl = siteUrl + endpoint;
        HttpEntity<?> entity = new HttpEntity<>(body, createHeaders());
        return restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
    }

    private ResponseEntity<String> sendMergeRequest(String endpoint, String jsonBody) {
        String fullUrl = siteUrl + endpoint;
        HttpHeaders headers = createHeaders();
        headers.set("IF-MATCH", "*");
        headers.set("X-HTTP-Method", "MERGE");
        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);
        return restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
    }

    @Override
    public boolean isAvailable() {
        return available;
    }

    @Override
    public String getName() {
        return "Certificate (SharePoint REST API)";
    }
}
