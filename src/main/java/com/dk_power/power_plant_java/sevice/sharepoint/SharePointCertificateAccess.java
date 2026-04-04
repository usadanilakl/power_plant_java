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
import org.springframework.web.client.HttpClientErrorException;
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
        log.debug("[SharePoint] SharePointCertificateAccess created (no credential bean)");
    }

    @Autowired(required = false)
    public SharePointCertificateAccess(
            ClientCertificateCredential credential,
            @Qualifier("sharepointRestTemplate") RestTemplate restTemplate) {
        this.credential = credential;
        this.restTemplate = restTemplate;
        log.debug("[SharePoint] SharePointCertificateAccess created with credential + RestTemplate");
    }

    @PostConstruct
    public void init() {
        if (credential == null) {
            log.warn("[SharePoint] No ClientCertificateCredential bean. Certificate access disabled.");
            return;
        }
        this.siteUrl = "https://" + siteHostname + sitePath;
        log.debug("[SharePoint] Site URL: {}", siteUrl);

        try {
            authenticate();
            ResponseEntity<String> response = sendGetRequest("/_api/web/title");
            if (response.getStatusCode().is2xxSuccessful()) {
                this.available = true;
                log.info("[SharePoint] sharepoint.access.ready siteUrl={}", siteUrl);
            } else {
                log.warn("[SharePoint] Connection test failed with status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.warn("[SharePoint] Initialization failed: {}. Will fall back to PowerAutomate.", e.getMessage());
            this.available = false;
        }
    }

    // ====================== List provisioning methods ======================

    public boolean listExists(String listTitle) {
        try {
            sendGetRequest("/_api/web/lists/getbytitle('" + listTitle + "')");
            return true;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (HttpClientErrorException.Unauthorized e) {
            tokenExpirationTime = null;
            try {
                sendGetRequest("/_api/web/lists/getbytitle('" + listTitle + "')");
                return true;
            } catch (HttpClientErrorException.NotFound e2) {
                return false;
            }
        }
    }

    public void createList(String listTitle) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("Title", listTitle);
        body.put("BaseTemplate", 100);
        body.put("Description", "Auto-provisioned by Power Plant App");
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            ResponseEntity<String> response = sendPostRequest("/_api/web/lists", jsonBody);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("SharePoint create list failed: " + response.getStatusCode());
            }
            log.debug("[SharePoint] Created list '{}'", listTitle);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create list '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public void addFieldToList(String listTitle, String fieldName, int fieldTypeKind) {
        String endpoint = "/_api/web/lists/getbytitle('" + listTitle + "')/fields";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("Title", fieldName);
        body.put("FieldTypeKind", fieldTypeKind);
        body.put("Required", false);
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            ResponseEntity<String> response = sendPostRequest(endpoint, jsonBody);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to add field: " + response.getStatusCode());
            }
            log.debug("[SharePoint] Added field '{}' to list '{}'", fieldName, listTitle);
        } catch (Exception e) {
            throw new RuntimeException("Failed to add field '" + fieldName + "' to list '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public void addLookupFieldToList(String listTitle, String fieldName, String targetListTitle, String targetFieldName) {
        String endpoint = "/_api/web/lists/getbytitle('" + listTitle + "')/fields";
        String targetListId = getListId(targetListTitle);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("Title", fieldName);
        body.put("FieldTypeKind", 7); // Lookup
        body.put("Required", false);
        body.put("LookupList", targetListId);
        body.put("LookupField", targetFieldName);
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            ResponseEntity<String> response = sendPostRequest(endpoint, jsonBody);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to add lookup field: " + response.getStatusCode());
            }
            log.debug("[SharePoint] Added lookup field '{}' to list '{}' (target='{}.{}')",
                    fieldName, listTitle, targetListTitle, targetFieldName);
        } catch (Exception e) {
            throw new RuntimeException("Failed to add lookup field '" + fieldName + "' to list '" + listTitle +
                    "': " + e.getMessage(), e);
        }
    }

    private String getListId(String listTitle) {
        try {
            ResponseEntity<String> response = sendGetRequest(
                    "/_api/web/lists/getbytitle('" + listTitle + "')?$select=Id"
            );
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode node = root.has("Id") ? root.path("Id") : root.path("d").path("Id");
            String id = node.asText(null);
            if (id == null || id.isBlank()) {
                throw new RuntimeException("SharePoint returned empty list ID");
            }
            return id;
        } catch (Exception e) {
            throw new RuntimeException("Failed to read list ID for '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public void addFieldToDefaultView(String listTitle, String fieldName) {
        String endpoint = "/_api/web/lists/getbytitle('" + listTitle + "')/DefaultView/ViewFields/addviewfield('" + fieldName + "')";
        try {
            ResponseEntity<String> response = sendPostRequest(endpoint, "{}");
            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("[SharePoint] Failed to add '{}' to default view of '{}': {}", fieldName, listTitle, response.getStatusCode());
            }
        } catch (Exception e) {
            log.warn("[SharePoint] Failed to add '{}' to default view of '{}': {}", fieldName, listTitle, e.getMessage());
        }
    }

    public boolean fieldExists(String listTitle, String fieldName) {
        String endpoint = "/_api/web/lists/getbytitle('" + listTitle + "')/fields/getbyinternalnameortitle('" + fieldName + "')";
        try {
            sendGetRequest(endpoint);
            return true;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (HttpClientErrorException.BadRequest e) {
            // SharePoint sometimes returns 400 instead of 404 for missing fields
            log.debug("[SharePoint] fieldExists 400 for '{}' on '{}', treating as not found", fieldName, listTitle);
            return false;
        } catch (HttpClientErrorException.Unauthorized e) {
            tokenExpirationTime = null;
            try {
                sendGetRequest(endpoint);
                return true;
            } catch (HttpClientErrorException.NotFound e2) {
                return false;
            } catch (HttpClientErrorException.BadRequest e2) {
                return false;
            }
        }
    }

    // ====================== Generic list methods (used by adapters) ======================

    public List<JsonNode> getListItems(String listTitle) {
        return getListItems(listTitle, null);
    }

    /**
     * Fetch items from a SharePoint list, optionally filtered by an OData expression.
     * @param filter OData $filter (e.g. "Modified gt datetime'2026-04-01T00:00:00Z'"), or null for all
     */
    public List<JsonNode> getListItems(String listTitle, String filter) {
        String url = "/_api/web/lists/getbytitle('" + listTitle + "')/items?$top=5000";
        if (filter != null && !filter.isEmpty()) {
            url += "&$filter=" + filter;
        }
        ResponseEntity<String> response = sendGetRequest(url);
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.has("value") ? root.path("value") : root.path("d").path("results");
            List<JsonNode> result = new ArrayList<>();
            for (JsonNode item : items) {
                result.add(item);
            }
            log.debug("[SharePoint] Fetched {} items from '{}'{}", result.size(), listTitle,
                filter != null ? " (filtered)" : "");
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse items from list '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    /**
     * Fetch list-level metadata fields (for cheap change probes).
     */
    public JsonNode getListMetadata(String listTitle) {
        ResponseEntity<String> response = sendGetRequest(
                "/_api/web/lists/getbytitle('" + listTitle + "')?$select=ItemCount,LastItemModifiedDate"
        );
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.has("d") ? root.path("d") : root;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse metadata for list '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public String createListItem(String listTitle, Map<String, Object> body) {
        String endpoint = "/_api/web/lists/getbytitle('" + listTitle + "')/items";
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            log.debug("[SharePoint] Creating item in '{}': {}", listTitle, jsonBody);

            ResponseEntity<String> response = sendPostRequest(endpoint, jsonBody);
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String id = root.has("ID") ? root.path("ID").asText(null) : root.path("d").path("ID").asText(null);
                log.debug("[SharePoint] Created item in '{}' with ID: {}", listTitle, id);
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

    public void deleteListItem(String listTitle, String itemId) {
        String endpoint = "/_api/web/lists/getbytitle('" + listTitle + "')/items(" + itemId + ")";
        try {
            sendDeleteRequest(endpoint);
            log.debug("[SharePoint] Deleted item {} in '{}'", itemId, listTitle);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete item " + itemId + " in list '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public void addListItemAttachment(String listTitle, String itemId, String fileName, byte[] content) {
        String endpoint = String.format(
                "/_api/web/lists/getbytitle('%s')/items(%s)/AttachmentFiles/add(FileName='%s')",
                listTitle, itemId, fileName);

        String fullUrl = siteUrl + endpoint;
        ResponseEntity<String> response;
        try {
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            HttpEntity<byte[]> entity = new HttpEntity<>(content, headers);
            response = restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[SharePoint] 401 on attachment upload, refreshing token and retrying");
            tokenExpirationTime = null;
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            HttpEntity<byte[]> entity = new HttpEntity<>(content, headers);
            response = restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        }

        if (response.getStatusCode().is2xxSuccessful()) {
            log.debug("[SharePoint] Attachment '{}' uploaded to {} in '{}'", fileName, itemId, listTitle);
        } else {
            throw new RuntimeException("Failed to upload attachment: " + response.getStatusCode());
        }
    }

    public List<JsonNode> getListItemAttachments(String listTitle, String itemId) {
        ResponseEntity<String> response = sendGetRequest(
                "/_api/web/lists/getbytitle('" + listTitle + "')/items(" + itemId + ")/AttachmentFiles"
        );
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.has("value") ? root.path("value") : root.path("d").path("results");
            List<JsonNode> result = new ArrayList<>();
            for (JsonNode item : items) {
                result.add(item);
            }
            log.debug("[SharePoint] Fetched {} attachments for item {} in '{}'", result.size(), itemId, listTitle);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse attachments for item " + itemId + " in '" + listTitle + "': " + e.getMessage(), e);
        }
    }

    public byte[] downloadListItemAttachment(String listTitle, String itemId, String fileName) {
        String endpoint = String.format(
                "/_api/web/lists/getbytitle('%s')/items(%s)/AttachmentFiles('%s')/$value",
                listTitle, itemId, fileName);

        String fullUrl = siteUrl + endpoint;
        ResponseEntity<byte[]> response;
        try {
            HttpHeaders headers = createHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_OCTET_STREAM));
            HttpEntity<?> entity = new HttpEntity<>(headers);
            response = restTemplate.exchange(fullUrl, HttpMethod.GET, entity, byte[].class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[SharePoint] 401 on attachment download, refreshing token and retrying");
            tokenExpirationTime = null;
            HttpHeaders headers = createHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_OCTET_STREAM));
            HttpEntity<?> entity = new HttpEntity<>(headers);
            response = restTemplate.exchange(fullUrl, HttpMethod.GET, entity, byte[].class);
        }

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            log.debug("[SharePoint] Downloaded attachment '{}' ({} bytes) from item {} in '{}'",
                    fileName, response.getBody().length, itemId, listTitle);
            return response.getBody();
        }
        throw new RuntimeException("Failed to download attachment '" + fileName + "' from item " + itemId + ": " + response.getStatusCode());
    }

    public byte[] downloadFileByUniqueId(String uniqueId) {
        String endpoint = "/_api/web/GetFileById('" + uniqueId + "')/$value";
        String fullUrl = siteUrl + endpoint;
        ResponseEntity<byte[]> response;
        try {
            HttpHeaders headers = createHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_OCTET_STREAM));
            HttpEntity<?> entity = new HttpEntity<>(headers);
            response = restTemplate.exchange(fullUrl, HttpMethod.GET, entity, byte[].class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[SharePoint] 401 on file download by GUID, refreshing token and retrying");
            tokenExpirationTime = null;
            HttpHeaders headers = createHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_OCTET_STREAM));
            HttpEntity<?> entity = new HttpEntity<>(headers);
            response = restTemplate.exchange(fullUrl, HttpMethod.GET, entity, byte[].class);
        }

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            log.debug("[SharePoint] Downloaded file by GUID '{}' ({} bytes)", uniqueId, response.getBody().length);
            return response.getBody();
        }
        throw new RuntimeException("Failed to download file by GUID '" + uniqueId + "': " + response.getStatusCode());
    }

    public void updateFileByUniqueId(String uniqueId, byte[] content) {
        String endpoint = "/_api/web/GetFileById('" + uniqueId + "')/$value";
        String fullUrl = siteUrl + endpoint;
        ResponseEntity<String> response;
        try {
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            HttpEntity<byte[]> entity = new HttpEntity<>(content, headers);
            response = restTemplate.exchange(fullUrl, HttpMethod.PUT, entity, String.class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[SharePoint] 401 on file update by GUID, refreshing token and retrying");
            tokenExpirationTime = null;
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            HttpEntity<byte[]> entity = new HttpEntity<>(content, headers);
            response = restTemplate.exchange(fullUrl, HttpMethod.PUT, entity, String.class);
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to update file by GUID '" + uniqueId + "': " + response.getStatusCode());
        }

        log.debug("[SharePoint] Updated file by GUID '{}' ({} bytes)", uniqueId, content.length);
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
        try {
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            return restTemplate.exchange(fullUrl, HttpMethod.GET, entity, String.class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[SharePoint] 401 on GET {}, refreshing token and retrying", endpoint);
            tokenExpirationTime = null;
            HttpEntity<?> entity = new HttpEntity<>(createHeaders());
            return restTemplate.exchange(fullUrl, HttpMethod.GET, entity, String.class);
        }
    }

    private ResponseEntity<String> sendPostRequest(String endpoint, Object body) {
        String fullUrl = siteUrl + endpoint;
        try {
            HttpEntity<?> entity = new HttpEntity<>(body, createHeaders());
            return restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[SharePoint] 401 on POST {}, refreshing token and retrying", endpoint);
            tokenExpirationTime = null;
            HttpEntity<?> entity = new HttpEntity<>(body, createHeaders());
            return restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        }
    }

    private ResponseEntity<String> sendMergeRequest(String endpoint, String jsonBody) {
        String fullUrl = siteUrl + endpoint;
        try {
            HttpHeaders headers = createHeaders();
            headers.set("IF-MATCH", "*");
            headers.set("X-HTTP-Method", "MERGE");
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);
            return restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[SharePoint] 401 on MERGE {}, refreshing token and retrying", endpoint);
            tokenExpirationTime = null;
            HttpHeaders headers = createHeaders();
            headers.set("IF-MATCH", "*");
            headers.set("X-HTTP-Method", "MERGE");
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);
            return restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        }
    }

    private ResponseEntity<String> sendDeleteRequest(String endpoint) {
        String fullUrl = siteUrl + endpoint;
        try {
            HttpHeaders headers = createHeaders();
            headers.set("IF-MATCH", "*");
            headers.set("X-HTTP-Method", "DELETE");
            HttpEntity<String> entity = new HttpEntity<>("{}", headers);
            return restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[SharePoint] 401 on DELETE {}, refreshing token and retrying", endpoint);
            tokenExpirationTime = null;
            HttpHeaders headers = createHeaders();
            headers.set("IF-MATCH", "*");
            headers.set("X-HTTP-Method", "DELETE");
            HttpEntity<String> entity = new HttpEntity<>("{}", headers);
            return restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        }
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
