package com.dk_power.power_plant_java.sevice.sharepoint;

import com.azure.core.credential.AccessToken;
import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.ClientCertificateCredential;
import com.dk_power.power_plant_java.dto.permits.SpaceDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
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
            // Verify connection by fetching site title
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
        headers.set("Accept", "application/json;odata=verbose");
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
    public List<WorkRequestDto> getAllWorkRequests() {
        ResponseEntity<String> response = sendGetRequest(
                "/_api/web/lists/getbytitle('Work Requests')/items?$top=5000"
        );

        List<WorkRequestDto> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.path("d").path("results");
            if (items.size() > 0) {
                JsonNode firstItem = items.get(0);
                Iterator<String> fieldNames = firstItem.fieldNames();
                List<String> names = new ArrayList<>();
                while (fieldNames.hasNext()) names.add(fieldNames.next());
                log.info("[SharePoint] Work Request fields: {}", names);
            }
            for (JsonNode item : items) {
                WorkRequestDto dto = new WorkRequestDto();
                dto.setSharepointId(item.path("ID").asText(null));
                dto.setDateOfWorkToBePerformed(item.path("Date_x0020_of_x0020_work_x0020_to_x0020_be_x0020_performed").asText(null));
                dto.setTimeOfWorkToBePerformed(item.path("Time_x0020_of_x0020_work_x0020_to_x0020_be_x0020_performed").asText(null));
                dto.setRequestedBy(item.path("Work_x0020_Requested_x0020_By").asText(null));
                dto.setCompany(item.path("Company").asText(null));
                dto.setLocation(item.path("Location_x0020_Of_x0020_Work").asText(null));
                dto.setAffectedEquipment(item.path("Affected_x0020_Equipment").asText(null));
                dto.setWorkScope(item.path("Work_x0020_Scope").asText(null));
                dto.setForeman(item.path("Foreman_x0020_Name").asText(null));
                dto.setFireWatch(item.path("Fire_x002d_watch_x0020_Name").asText(null));
                dto.setStatus(item.path("Status").asText(null));

                String hotWork = item.path("Is_x0020_Hot_x0020_Work_x0020_Required_x0020__x0028_welding_x002c__x0020_cutting_x002c__x0020_griding_x002c__x0020_open_x0020_flame_x002c__x0020_sparks_x0029_").asText(null);
                if (hotWork != null) dto.setIsHotWorkRequired(hotWork);

                String loto = item.path("Is_x0020_LOTO_x0020_Required_x003f_").asText(null);
                if (loto != null) dto.setIsLotoRequired(loto);

                String confined = item.path("Is_x0020_Confined_x0020_Space_x0020_Entry_x0020_Required_x003f_").asText(null);
                if (confined != null) dto.setIsConfinedSpaceEntryRequired(confined);

                dto.setSpace(item.path("Space_x0020_to_x0020_be_x0020_entered_x003a_").asText(null));
                results.add(dto);
            }
            log.debug("[SharePoint] Fetched {} work requests via REST API", results.size());
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse work requests response: " + e.getMessage(), e);
        }
        return results;
    }

    @Override
    public String createWorkRequest(WorkRequestDto dto) {
        String endpoint = "/_api/web/lists/getbytitle('Work Requests')/items";

        // Build JSON body with SharePoint internal field names
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("__metadata", Map.of("type", "SP.Data.Work_x0020_RequestsListItem"));

        // Map DTO fields to SharePoint internal field names
        if (dto.getDateOfWorkToBePerformed() != null) {
            body.put("Date_x0020_of_x0020_work_x0020_to_x0020_be_x0020_performed", dto.getDateOfWorkToBePerformed());
        }
        if (dto.getTimeOfWorkToBePerformed() != null) {
            body.put("Time_x0020_of_x0020_work_x0020_to_x0020_be_x0020_performed", dto.getTimeOfWorkToBePerformed());
        }
        if (dto.getRequestedBy() != null) {
            body.put("Work_x0020_Requested_x0020_By", dto.getRequestedBy());
        }
        if (dto.getCompany() != null) {
            body.put("Company", dto.getCompany());
        }
        if (dto.getLocation() != null) {
            body.put("Location_x0020_Of_x0020_Work", dto.getLocation());
        }
        if (dto.getAffectedEquipment() != null) {
            body.put("Affected_x0020_Equipment", dto.getAffectedEquipment());
        }
        if (dto.getWorkScope() != null) {
            body.put("Work_x0020_Scope", dto.getWorkScope());
        }
        if (dto.getForeman() != null) {
            body.put("Foreman_x0020_Name", dto.getForeman());
        }
        if (dto.getFireWatch() != null) {
            body.put("Fire_x002d_watch_x0020_Name", dto.getFireWatch());
        }
        if (dto.getIsHotWorkRequired() != null) {
            body.put("Is_x0020_Hot_x0020_Work_x0020_Required_x0020__x0028_welding_x002c__x0020_cutting_x002c__x0020_griding_x002c__x0020_open_x0020_flame_x002c__x0020_sparks_x0029_",
                    dto.getIsHotWorkRequired());
        }
        if (dto.getIsLotoRequired() != null) {
            body.put("Is_x0020_LOTO_x0020_Required_x003f_", dto.getIsLotoRequired());
        }
        if (dto.getIsConfinedSpaceEntryRequired() != null) {
            body.put("Is_x0020_Confined_x0020_Space_x0020_Entry_x0020_Required_x003f_", dto.getIsConfinedSpaceEntryRequired());
        }
        if (dto.getSpace() != null) {
            body.put("Space_x0020_to_x0020_be_x0020_entered_x003a_", dto.getSpace());
        }
        body.put("Status", "Active");

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            log.info("[SharePoint] Creating work request: {}", jsonBody);

            ResponseEntity<String> response = sendPostRequest(endpoint, jsonBody);

            if (response.getStatusCode().is2xxSuccessful()) {
                // Extract ID from response
                JsonNode root = objectMapper.readTree(response.getBody());
                String id = root.path("d").path("ID").asText(null);
                log.info("[SharePoint] Created work request with ID: {}", id);
                return id;
            } else {
                throw new RuntimeException("SharePoint create failed: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[SharePoint] Failed to create work request: {}", e.getMessage());
            throw new RuntimeException("Failed to create work request in SharePoint: " + e.getMessage(), e);
        }
    }

    @Override
    public void archiveWorkRequest(String sharepointId) {
        String endpoint = "/_api/web/lists/getbytitle('Work Requests')/items(" + sharepointId + ")";
        String body = "{\"Status\":\"Archived\"}";
        sendMergeRequest(endpoint, body);
        log.debug("[SharePoint] Archived work request {}", sharepointId);
    }

    @Override
    public void changeWorkRequestStatus(String sharepointId, String status) {
        String endpoint = "/_api/web/lists/getbytitle('Work Requests')/items(" + sharepointId + ")";
        String body = "{\"Status\":\"" + status.replace("\"", "\\\"") + "\"}";
        sendMergeRequest(endpoint, body);
        log.debug("[SharePoint] Changed work request {} status to '{}'", sharepointId, status);
    }

    @Override
    public List<SpaceDto> getAllSpaces() {
        ResponseEntity<String> response = sendGetRequest(
                "/_api/web/lists/getbytitle('Confined Spaces')/items?$top=5000"
        );

        List<SpaceDto> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.path("d").path("results");
            if (items.size() > 0) {
                JsonNode firstItem = items.get(0);
                Iterator<String> fieldNames = firstItem.fieldNames();
                List<String> names = new ArrayList<>();
                while (fieldNames.hasNext()) names.add(fieldNames.next());
                log.info("[SharePoint] Confined Spaces fields: {}", names);
            }
            for (JsonNode item : items) {
                SpaceDto dto = new SpaceDto();
                dto.setSharepointId(item.path("ID").asText(null));
                dto.setSpace(item.path("Title").asText(null));
                dto.setStatus(item.path("Status").asText(null));
                dto.setCo(item.path("CO").asText(null));
                dto.setOxygen(item.path("Oxygen").asText(null));
                dto.setLel(item.path("LEL").asText(null));
                dto.setH2s(item.path("H2S").asText(null));
                dto.setNh3(item.path("NH3").asText(null));
                dto.setTesterName(item.path("Tester_x0020_Name").asText(null));
                dto.setLastStatusChange(item.path("Last_x0020_Status_x0020_Change").asText(null));
                dto.setMeterSerialNumber(item.path("Meter_x0020_Serial_x0020_Number").asText(null));
                results.add(dto);
            }
            log.debug("[SharePoint] Fetched {} spaces via REST API", results.size());
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse spaces response: " + e.getMessage(), e);
        }
        return results;
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
