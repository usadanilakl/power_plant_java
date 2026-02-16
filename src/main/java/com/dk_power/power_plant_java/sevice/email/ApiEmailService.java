package com.dk_power.power_plant_java.sevice.email;

import com.azure.core.credential.AccessToken;
import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.ClientCertificateCredential;
import com.dk_power.power_plant_java.dto.email.EmailAttachment;
import com.dk_power.power_plant_java.dto.email.EmailRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
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
}
