package com.dk_power.power_plant_java.sevice.sharepoint;

import com.azure.core.credential.AccessToken;
import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.ClientCertificateCredential;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
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

import java.time.*;
import java.time.format.DateTimeFormatter;
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
    public List<WorkRequestDto> getAllWorkRequests() {
        ResponseEntity<String> response = sendGetRequest(
                "/_api/web/lists/getbytitle('Work Requests')/items?$top=5000"
        );

        List<WorkRequestDto> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            // nometadata uses "value", verbose uses "d.results"
            JsonNode items = root.has("value") ? root.path("value") : root.path("d").path("results");
            for (JsonNode item : items) {
                WorkRequestDto dto = new WorkRequestDto();
                dto.setSharepointId(item.path("ID").asText(item.path("Id").asText(null)));
                // SharePoint returns DateOfWork as combined UTC datetime (e.g. "2026-02-15T20:30:00Z")
                // Split into separate date + time in Central Time for H2 storage
                String rawDateOfWork = item.path("DateOfWork").asText(null);
                String[] centralDateAndTime = fromSharePointDateTime(rawDateOfWork);
                dto.setDateOfWorkToBePerformed(centralDateAndTime[0]);
                dto.setTimeOfWorkToBePerformed(centralDateAndTime[1]);
                dto.setRequestedBy(item.path("WorkRequestedBy").asText(null));
                dto.setCompany(item.path("Company").asText(null));
                dto.setLocation(item.path("LocationOfWork").asText(null));
                dto.setAffectedEquipment(item.path("AffectedEquipment").asText(null));
                dto.setWorkScope(item.path("Title").asText(null));
                dto.setBooleanIsLotoRequired(item.path("IsLOTORequired").asBoolean(false));
                dto.setBooleanIsHotWorkRequired(item.path("IsHotWorkRequired").asBoolean(false));
                dto.setBooleanIsConfinedSpaceEntryRequired(item.path("IsConfinedSpaceEntryRequired").asBoolean(false));
                dto.setForeman(item.path("ForemanName").asText(null));
                dto.setFireWatch(item.path("FireWatchName").asText(null));
                dto.setSpace(item.path("SpaceToBeEntered").asText(null));
                dto.setStatus(item.path("Status").asText(null));
                dto.setLocalUuid(item.path("PwaId").asText(null));
                dto.setSubmitterName(item.path("SubmitterName").asText(null));
                dto.setSubmitterEmail(item.path("SubmitterEmail").asText(null));
                dto.setSubmitterPhone(item.path("SubmitterPhone").asText(null));
                dto.setSubmitterCompany(item.path("SubmitterCompany").asText(null));
                dto.setTimeSubmitted(item.path("TimeSubmitted").asText(null));
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

        // Build JSON body using modern SharePoint column names (same as PA V2)
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("PwaId", dto.getLocalUuid() != null ? dto.getLocalUuid() : "");
        // Combine date + time as Central Time with offset so SharePoint stores correctly
        body.put("DateOfWork", toCentralIso(dto.getDateOfWorkToBePerformed(), dto.getTimeOfWorkToBePerformed()));
        body.put("WorkRequestedBy", dto.getRequestedBy() != null ? dto.getRequestedBy() : "");
        body.put("Company", dto.getCompany() != null ? dto.getCompany() : "");
        body.put("LocationOfWork", dto.getLocation() != null ? dto.getLocation() : "");
        body.put("AffectedEquipment", dto.getAffectedEquipment() != null ? dto.getAffectedEquipment() : "");
        body.put("Title", dto.getWorkScope() != null ? dto.getWorkScope() : "");
        body.put("WorkScope", dto.getWorkScope() != null ? dto.getWorkScope() : "");
        body.put("IsLOTORequired", Boolean.TRUE.equals(dto.getIsLotoRequired()));
        body.put("IsHotWorkRequired", Boolean.TRUE.equals(dto.getIsHotWorkRequired()));
        body.put("IsConfinedSpaceEntryRequired", Boolean.TRUE.equals(dto.getIsConfinedSpaceEntryRequired()));
        body.put("ForemanName", dto.getForeman() != null ? dto.getForeman() : "");
        body.put("FireWatchName", dto.getFireWatch() != null ? dto.getFireWatch() : "");
        body.put("SpaceToBeEntered", dto.getSpace() != null ? dto.getSpace() : "");
        body.put("Status", dto.getStatus() != null ? dto.getStatus() : "Active");
        body.put("SubmitterName", dto.getSubmitterName() != null ? dto.getSubmitterName() : "");
        body.put("SubmitterEmail", dto.getSubmitterEmail() != null ? dto.getSubmitterEmail() : "");
        body.put("SubmitterPhone", dto.getSubmitterPhone() != null ? dto.getSubmitterPhone() : "");
        body.put("SubmitterCompany", dto.getSubmitterCompany() != null ? dto.getSubmitterCompany() : "");
        body.put("TimeSubmitted", dto.getTimeSubmitted() != null ? dto.getTimeSubmitted() : "");

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            log.info("[SharePoint] Creating work request: {}", jsonBody);

            ResponseEntity<String> response = sendPostRequest(endpoint, jsonBody);

            if (response.getStatusCode().is2xxSuccessful()) {
                // Extract ID from response (nometadata: root.ID, verbose: d.ID)
                JsonNode root = objectMapper.readTree(response.getBody());
                String id = root.has("ID") ? root.path("ID").asText(null) : root.path("d").path("ID").asText(null);
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
    public void addAttachment(String entityType, String sharepointId, PaAttachmentDto attachment) {
        String listTitle;
        if ("WorkRequest".equals(entityType)) {
            listTitle = "Work Requests";
        } else if ("Jha".equals(entityType)) {
            listTitle = "JHA";
        } else if ("ConfinedSpace".equals(entityType)) {
            listTitle = "Confined Spaces";
        } else {
            throw new IllegalArgumentException("Unknown entity type: " + entityType);
        }

        String endpoint = String.format(
                "/_api/web/lists/getbytitle('%s')/items(%s)/AttachmentFiles/add(FileName='%s')",
                listTitle, sharepointId, attachment.getFileName());

        byte[] fileBytes = Base64.getDecoder().decode(attachment.getBase64Content());

        String fullUrl = siteUrl + endpoint;
        HttpHeaders headers = createHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        HttpEntity<byte[]> entity = new HttpEntity<>(fileBytes, headers);

        ResponseEntity<String> response = restTemplate.exchange(fullUrl, HttpMethod.POST, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful()) {
            log.info("[SharePoint] Attachment '{}' uploaded to {} {}", attachment.getFileName(), entityType, sharepointId);
        } else {
            throw new RuntimeException("Failed to upload attachment: " + response.getStatusCode());
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

    /**
     * Parse a combined UTC datetime from SharePoint (e.g. "2026-02-15T20:30:00Z")
     * into [date, time] in Central Time (e.g. ["2026-02-15", "14:30"]).
     */
    private String[] fromSharePointDateTime(String raw) {
        if (raw == null || raw.isEmpty()) return new String[]{ null, null };
        try {
            // Remove trailing Z and parse as LocalDateTime, then convert UTC → Central
            String cleaned = raw.replace("Z", "").replace("z", "");
            if (!cleaned.contains("T")) return new String[]{ raw, null };
            LocalDateTime utcLdt = LocalDateTime.parse(cleaned);
            ZonedDateTime utc = utcLdt.atZone(ZoneId.of("UTC"));
            ZonedDateTime central = utc.withZoneSameInstant(ZoneId.of("America/Chicago"));
            String date = central.toLocalDate().toString(); // yyyy-MM-dd
            String time = String.format("%02d:%02d", central.getHour(), central.getMinute());
            return new String[]{ date, time };
        } catch (Exception e) {
            log.warn("[SharePoint] Failed to parse DateOfWork '{}': {}", raw, e.getMessage());
            // Fallback: naive split
            if (raw.contains("T")) {
                String[] parts = raw.split("T");
                String timePart = parts[1].length() >= 5 ? parts[1].substring(0, 5) : parts[1];
                return new String[]{ parts[0], timePart };
            }
            return new String[]{ raw, null };
        }
    }

    private String toCentralIso(String date, String time) {
        if (date == null || date.isEmpty()) return "";
        String timeStr = (time != null && !time.isEmpty()) ? time : "00:00";
        if (timeStr.length() == 5) timeStr += ":00";
        try {
            LocalDateTime ldt = LocalDateTime.parse(date + "T" + timeStr);
            ZonedDateTime central = ldt.atZone(ZoneId.of("America/Chicago"));
            return central.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (Exception e) {
            log.warn("[SharePoint] Failed to parse date/time: {} / {}", date, time);
            return date + "T" + timeStr;
        }
    }
}
