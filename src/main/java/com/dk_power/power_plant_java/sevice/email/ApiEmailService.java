package com.dk_power.power_plant_java.sevice.email;

import com.azure.core.credential.AccessToken;
import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.ClientCertificateCredential;
import com.dk_power.power_plant_java.dto.email.EmailAttachment;
import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.dto.email.GraphEmailMessage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Email service using Microsoft Graph API with certificate authentication.
 * Follows the same token management pattern as SharePointCertificateAccess.
 */
@Service
@Slf4j
public class ApiEmailService {

    private final ClientCertificateCredential credential;
    private final RestTemplate restTemplate;

    @Value("${email.graph.from}")
    private String fromEmail;

    @Value("${email.graph.fallback:}")
    private String fallbackEmail;

    private String emailAccessToken;
    private Instant emailTokenExpirationTime;

    @Autowired(required = false)
    public ApiEmailService(
            ClientCertificateCredential credential,
            @Qualifier("emailRestTemplate") RestTemplate restTemplate) {
        this.credential = credential;
        this.restTemplate = restTemplate;
        log.info("[Email] ApiEmailService created with certificate credential");
    }

    /**
     * Sends email via Microsoft Graph API.
     * @param request Email request with to/from/cc/subject/body/attachments
     */
    public void sendEmail(EmailRequest request) {
        if (credential == null) {
            throw new RuntimeException("ClientCertificateCredential not available for email sending");
        }

        try {
            sendEmailAs(request, fromEmail);
        } catch (HttpClientErrorException.NotFound e) {
            if (hasFallback()) {
                log.warn("[Email] Primary mailbox {} failed ({}), trying fallback {}",
                        fromEmail, extractErrorCode(e), fallbackEmail);
                sendEmailAs(request, fallbackEmail);
            } else {
                throw e;
            }
        }
    }

    private void sendEmailAs(EmailRequest request, String senderEmail) {
        ensureValidToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(emailAccessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String requestBody = buildRequestBody(request);
        HttpEntity<String> httpRequest = new HttpEntity<>(requestBody, headers);

        String graphApiUrl = "https://graph.microsoft.com/v1.0/users/" + senderEmail + "/sendMail";

        log.debug("[Email] Sending email to {} via Graph API as {}", request.getTo(), senderEmail);

        ResponseEntity<String> response = exchangeWithRetry(
                graphApiUrl, HttpMethod.POST, httpRequest, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("[Email] Failed to send email. Status: {}, Body: {}",
                    response.getStatusCode(), response.getBody());
            throw new RuntimeException("Email API failed: " + response.getBody());
        }

        log.info("[Email] Email sent successfully via Graph API to {} (from {})", request.getTo(), senderEmail);
    }

    /**
     * Sends email via Graph API using create-draft-then-send approach.
     * Returns metadata (graphMessageId, internetMessageId, conversationId)
     * needed for matching inbound replies to outbound correspondence.
     */
    public SentEmailMetadata sendEmailAndGetMetadata(EmailRequest request) {
        if (credential == null) {
            throw new RuntimeException("ClientCertificateCredential not available for email sending");
        }

        try {
            return sendEmailAndGetMetadataAs(request, fromEmail);
        } catch (HttpClientErrorException.NotFound e) {
            if (hasFallback()) {
                log.warn("[Email] Primary mailbox {} failed ({}), trying fallback {}",
                        fromEmail, extractErrorCode(e), fallbackEmail);
                return sendEmailAndGetMetadataAs(request, fallbackEmail);
            } else {
                throw e;
            }
        }
    }

    private SentEmailMetadata sendEmailAndGetMetadataAs(EmailRequest request, String senderEmail) {
        ensureValidToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(emailAccessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Step 1: Create draft message (returns full message object with metadata)
        String draftBody = buildMessageJson(request);
        String createUrl = "https://graph.microsoft.com/v1.0/users/" + senderEmail + "/messages";

        log.debug("[Email] Creating draft message for {} as {}", request.getTo(), senderEmail);
        ResponseEntity<String> draftResponse = exchangeWithRetry(
                createUrl, HttpMethod.POST, new HttpEntity<>(draftBody, headers), String.class);

        if (!draftResponse.getStatusCode().is2xxSuccessful() || draftResponse.getBody() == null) {
            throw new RuntimeException("Failed to create draft email: " + draftResponse.getStatusCode());
        }

        // Parse draft response to extract metadata
        SentEmailMetadata metadata;
        String graphMessageId;
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode draft = mapper.readTree(draftResponse.getBody());
            graphMessageId = getTextValue(draft, "id");
            String internetMessageId = getTextValue(draft, "internetMessageId");
            String conversationId = getTextValue(draft, "conversationId");
            metadata = new SentEmailMetadata(graphMessageId, internetMessageId, conversationId);
            log.debug("[Email] Draft created: graphId={}, internetMsgId={}, convId={}",
                    graphMessageId, internetMessageId, conversationId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse draft response", e);
        }

        // Step 2: Send the draft
        String sendUrl = "https://graph.microsoft.com/v1.0/users/" + senderEmail
                + "/messages/" + graphMessageId + "/send";
        ResponseEntity<String> sendResponse = exchangeWithRetry(
                sendUrl, HttpMethod.POST, new HttpEntity<>(headers), String.class);

        if (!sendResponse.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to send draft email: " + sendResponse.getStatusCode());
        }

        log.info("[Email] Email sent via draft-then-send to {} (from {})", request.getTo(), senderEmail);
        return metadata;
    }

    /**
     * Metadata returned after sending an email via the draft approach.
     */
    @Getter
    @AllArgsConstructor
    public static class SentEmailMetadata {
        private final String graphMessageId;
        private final String internetMessageId;
        private final String conversationId;
    }

    private boolean hasFallback() {
        return fallbackEmail != null && !fallbackEmail.isEmpty();
    }

    private String extractErrorCode(HttpClientErrorException e) {
        String body = e.getResponseBodyAsString();
        if (body.contains("\"code\":\"")) {
            int start = body.indexOf("\"code\":\"") + 8;
            int end = body.indexOf("\"", start);
            if (end > start) return body.substring(start, end);
        }
        return e.getStatusCode().toString();
    }

    /**
     * Authenticates and acquires Graph API token.
     */
    private void authenticate() {
        TokenRequestContext context = new TokenRequestContext();
        context.addScopes("https://graph.microsoft.com/.default");

        AccessToken token = credential.getToken(context).block();
        if (token != null) {
            this.emailAccessToken = token.getToken();
            this.emailTokenExpirationTime = token.getExpiresAt().toInstant();
            log.debug("[Email] Token acquired, expires at {}", emailTokenExpirationTime);
        } else {
            throw new RuntimeException("Failed to acquire Graph API email token");
        }
    }

    /**
     * Ensures token is valid, refreshes if expired or about to expire (5min buffer).
     */
    private void ensureValidToken() {
        if (emailTokenExpirationTime == null ||
                Instant.now().isAfter(emailTokenExpirationTime.minus(Duration.ofMinutes(5)))) {
            authenticate();
        }
    }

    /**
     * Executes a REST exchange with automatic 401 retry.
     * On Unauthorized, invalidates cached token, re-authenticates, and retries once.
     */
    private <T> ResponseEntity<T> exchangeWithRetry(String url, HttpMethod method,
                                                      HttpEntity<?> entity, Class<T> responseType) {
        try {
            return restTemplate.exchange(url, method, entity, responseType);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("[Email] 401 received, refreshing token and retrying: {} {}", method, url);
            emailTokenExpirationTime = null;
            ensureValidToken();
            HttpHeaders newHeaders = new HttpHeaders();
            newHeaders.putAll(entity.getHeaders());
            newHeaders.setBearerAuth(emailAccessToken);
            HttpEntity<?> retryEntity = new HttpEntity<>(entity.getBody(), newHeaders);
            return restTemplate.exchange(url, method, retryEntity, responseType);
        }
    }

    /**
     * Builds Graph API sendMail request body JSON (wraps message in sendMail envelope).
     */
    private String buildRequestBody(EmailRequest request) {
        return "{\"message\": " + buildMessageJson(request) + ",\"saveToSentItems\": \"true\"}";
    }

    /**
     * Builds just the message JSON object (used for both sendMail wrapper and create-draft).
     */
    private String buildMessageJson(EmailRequest request) {
        StringBuilder json = new StringBuilder();
        json.append("{");

        // Subject
        json.append("\"subject\": \"").append(escapeJson(request.getSubject())).append("\",");

        // Body — HTML if the caller opted in (the SDS gap report uses this), Text otherwise.
        json.append("\"body\": {");
        json.append("\"contentType\": \"").append(request.isHtml() ? "HTML" : "Text").append("\",");
        json.append("\"content\": \"").append(escapeJson(request.getBody())).append("\"");
        json.append("},");

        // To recipients
        json.append("\"toRecipients\": [{");
        json.append("\"emailAddress\": {\"address\": \"").append(escapeJson(request.getTo())).append("\"}");
        json.append("}]");

        // CC recipients (supports semicolon or comma-separated list)
        if (request.getCc() != null && !request.getCc().isEmpty()) {
            String[] ccAddresses = request.getCc().split("[;,]");
            json.append(",\"ccRecipients\": [");
            boolean first = true;
            for (String addr : ccAddresses) {
                String trimmed = addr.trim();
                if (trimmed.isEmpty()) continue;
                if (!first) json.append(",");
                json.append("{\"emailAddress\": {\"address\": \"").append(escapeJson(trimmed)).append("\"}}");
                first = false;
            }
            json.append("]");
        }

        // Attachments
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            json.append(",\"attachments\": [");
            List<EmailAttachment> attachments = request.getAttachments();
            for (int i = 0; i < attachments.size(); i++) {
                EmailAttachment att = attachments.get(i);
                if (i > 0) json.append(",");
                json.append("{");
                json.append("\"@odata.type\": \"#microsoft.graph.fileAttachment\",");
                json.append("\"name\": \"").append(escapeJson(att.getFileName())).append("\",");
                json.append("\"contentBytes\": \"").append(att.getBase64Content()).append("\"");
                json.append("}");
            }
            json.append("]");
        }

        json.append("}");
        return json.toString();
    }

    /**
     * Escapes special characters for JSON string values.
     */
    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Get messages from inbox since a specific date.
     * Used for email polling to track correspondence responses.
     *
     * @param userEmail Email address to query
     * @param since Get emails received after this date/time
     * @param pageSize Maximum number of messages to retrieve
     * @return List of GraphEmailMessage objects
     */
    public List<GraphEmailMessage> getMessagesSince(String userEmail, LocalDateTime since, int pageSize) {
        if (credential == null) {
            log.warn("[Email] Cannot read emails - ClientCertificateCredential not available");
            return Collections.emptyList();
        }

        try {
            return fetchMessagesSince(userEmail, since, pageSize);
        } catch (HttpClientErrorException.NotFound e) {
            if (hasFallback()) {
                log.warn("[Email] Primary mailbox {} failed ({}), trying fallback {}",
                        userEmail, extractErrorCode(e), fallbackEmail);
                try {
                    return fetchMessagesSince(fallbackEmail, since, pageSize);
                } catch (Exception fallbackEx) {
                    log.error("[Email] Fallback mailbox also failed", fallbackEx);
                    return Collections.emptyList();
                }
            }
            log.error("[Email] Error fetching messages", e);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("[Email] Error fetching messages", e);
            return Collections.emptyList();
        }
    }

    private List<GraphEmailMessage> fetchMessagesSince(String mailbox, LocalDateTime since, int pageSize) {
        ensureValidToken();

        String sinceFilter = since.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String graphApiUrl = String.format(
            "https://graph.microsoft.com/v1.0/users/%s/messages?" +
            "$filter=receivedDateTime ge %sZ&" +
            "$top=%d&" +
            "$select=id,subject,body,sender,toRecipients,sentDateTime,receivedDateTime," +
            "internetMessageId,conversationId,isRead,internetMessageHeaders&" +
            "$orderby=receivedDateTime desc",
            mailbox,
            sinceFilter,
            pageSize
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(emailAccessToken);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<String> httpRequest = new HttpEntity<>(headers);

        log.debug("[Email] Fetching messages since {} from {}", since, mailbox);

        ResponseEntity<String> response = exchangeWithRetry(
            graphApiUrl, HttpMethod.GET, httpRequest, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return parseGraphMessages(response.getBody());
        } else {
            log.error("[Email] Failed to fetch messages. Status: {}", response.getStatusCode());
            return Collections.emptyList();
        }
    }

    /**
     * Parses Graph API JSON response into GraphEmailMessage objects.
     */
    private List<GraphEmailMessage> parseGraphMessages(String jsonResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode valueArray = root.get("value");

            if (valueArray == null || !valueArray.isArray()) {
                return Collections.emptyList();
            }

            List<GraphEmailMessage> messages = new ArrayList<>();
            for (JsonNode messageNode : valueArray) {
                try {
                    GraphEmailMessage message = GraphEmailMessage.builder()
                        .id(getTextValue(messageNode, "id"))
                        .subject(getTextValue(messageNode, "subject"))
                        .bodyContent(extractBodyContent(messageNode))
                        .senderEmail(extractSenderEmail(messageNode))
                        .sentDateTime(parseDateTime(messageNode.get("sentDateTime")))
                        .receivedDateTime(parseDateTime(messageNode.get("receivedDateTime")))
                        .internetMessageId(getTextValue(messageNode, "internetMessageId"))
                        .conversationId(getTextValue(messageNode, "conversationId"))
                        .isRead(messageNode.has("isRead") ? messageNode.get("isRead").asBoolean() : false)
                        .headers(extractHeaders(messageNode))
                        .build();
                    messages.add(message);
                } catch (Exception e) {
                    log.warn("[Email] Failed to parse individual message: {}", e.getMessage());
                }
            }

            log.info("[Email] Parsed {} messages from Graph API response", messages.size());
            return messages;

        } catch (Exception e) {
            log.error("[Email] Failed to parse Graph API response", e);
            return Collections.emptyList();
        }
    }

    /**
     * Extracts body content from Graph API message node.
     */
    private String extractBodyContent(JsonNode messageNode) {
        if (!messageNode.has("body")) return "";
        JsonNode bodyNode = messageNode.get("body");
        if (bodyNode.has("content")) {
            return bodyNode.get("content").asText();
        }
        return "";
    }

    /**
     * Extracts sender email address from Graph API message node.
     */
    private String extractSenderEmail(JsonNode messageNode) {
        if (!messageNode.has("sender")) return "";
        JsonNode senderNode = messageNode.get("sender");
        if (senderNode.has("emailAddress") && senderNode.get("emailAddress").has("address")) {
            return senderNode.get("emailAddress").get("address").asText();
        }
        return "";
    }

    /**
     * Extracts internet message headers from Graph API message node.
     */
    private List<GraphEmailMessage.InternetMessageHeader> extractHeaders(JsonNode messageNode) {
        if (!messageNode.has("internetMessageHeaders")) return Collections.emptyList();

        JsonNode headersArray = messageNode.get("internetMessageHeaders");
        if (!headersArray.isArray()) return Collections.emptyList();

        List<GraphEmailMessage.InternetMessageHeader> headers = new ArrayList<>();
        for (JsonNode headerNode : headersArray) {
            if (headerNode.has("name") && headerNode.has("value")) {
                headers.add(GraphEmailMessage.InternetMessageHeader.builder()
                    .name(headerNode.get("name").asText())
                    .value(headerNode.get("value").asText())
                    .build());
            }
        }
        return headers;
    }

    /**
     * Parses ISO 8601 datetime string to LocalDateTime.
     */
    private LocalDateTime parseDateTime(JsonNode node) {
        if (node == null || node.isNull()) return null;
        try {
            String dateTimeStr = node.asText();
            // Remove 'Z' suffix and parse
            if (dateTimeStr.endsWith("Z")) {
                dateTimeStr = dateTimeStr.substring(0, dateTimeStr.length() - 1);
            }
            return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            log.warn("[Email] Failed to parse datetime: {}", node.asText());
            return null;
        }
    }

    /**
     * Safely extracts text value from JSON node.
     */
    private String getTextValue(JsonNode node, String fieldName) {
        if (!node.has(fieldName)) return null;
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode.isNull() ? null : fieldNode.asText();
    }
}
