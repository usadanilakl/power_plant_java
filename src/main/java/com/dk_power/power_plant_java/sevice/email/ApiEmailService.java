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
import org.springframework.web.client.RestTemplate;

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

        ensureValidToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(emailAccessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String requestBody = buildRequestBody(request);
        HttpEntity<String> httpRequest = new HttpEntity<>(requestBody, headers);

        String graphApiUrl = "https://graph.microsoft.com/v1.0/users/" + fromEmail + "/sendMail";

        log.debug("[Email] Sending email to {} via Graph API", request.getTo());

        ResponseEntity<String> response = restTemplate.exchange(
                graphApiUrl,
                HttpMethod.POST,
                httpRequest,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("[Email] Failed to send email. Status: {}, Body: {}",
                    response.getStatusCode(), response.getBody());
            throw new RuntimeException("Email API failed: " + response.getBody());
        }

        log.info("[Email] Email sent successfully via Graph API to {}", request.getTo());
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
     * Builds Graph API request body JSON.
     * Supports to/cc/subject/body/attachments.
     */
    private String buildRequestBody(EmailRequest request) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"message\": {");

        // Subject
        json.append("\"subject\": \"").append(escapeJson(request.getSubject())).append("\",");

        // Body
        json.append("\"body\": {");
        json.append("\"contentType\": \"Text\",");
        json.append("\"content\": \"").append(escapeJson(request.getBody())).append("\"");
        json.append("},");

        // To recipients
        json.append("\"toRecipients\": [{");
        json.append("\"emailAddress\": {\"address\": \"").append(escapeJson(request.getTo())).append("\"}");
        json.append("}]");

        // CC recipients
        if (request.getCc() != null && !request.getCc().isEmpty()) {
            json.append(",\"ccRecipients\": [{");
            json.append("\"emailAddress\": {\"address\": \"").append(escapeJson(request.getCc())).append("\"}");
            json.append("}]");
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

        json.append("},");
        json.append("\"saveToSentItems\": \"true\"");
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

        ensureValidToken();

        String sinceFilter = since.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String graphApiUrl = String.format(
            "https://graph.microsoft.com/v1.0/users/%s/messages?" +
            "$filter=receivedDateTime ge %sZ&" +
            "$top=%d&" +
            "$select=id,subject,body,sender,toRecipients,sentDateTime,receivedDateTime," +
            "internetMessageId,conversationId,isRead,internetMessageHeaders&" +
            "$orderby=receivedDateTime desc",
            userEmail,
            sinceFilter,
            pageSize
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(emailAccessToken);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<String> httpRequest = new HttpEntity<>(headers);

        log.debug("[Email] Fetching messages since {} from {}", since, userEmail);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                graphApiUrl,
                HttpMethod.GET,
                httpRequest,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGraphMessages(response.getBody());
            } else {
                log.error("[Email] Failed to fetch messages. Status: {}", response.getStatusCode());
                return Collections.emptyList();
            }
        } catch (Exception e) {
            log.error("[Email] Error fetching messages", e);
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
