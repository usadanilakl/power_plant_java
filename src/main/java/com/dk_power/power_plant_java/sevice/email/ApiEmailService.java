package com.dk_power.power_plant_java.sevice.email;

import com.azure.core.credential.AccessToken;
import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.ClientCertificateCredential;
import com.dk_power.power_plant_java.dto.email.EmailAttachment;
import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.dto.email.GraphEmailMessage;
import java.util.Base64;
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

    @Value("${email.graph.from:}")
    private String fromEmail;

    @Value("${email.graph.fallback:}")
    private String fallbackEmail;

    private String emailAccessToken;
    private Instant emailTokenExpirationTime;

    /**
     * No credential available - the application still starts, email simply does not send.
     *
     * <p>Without this the application CANNOT BOOT on a machine with no
     * {@code application-secrets.properties}. {@code @Autowired(required = false)} on the only
     * constructor does not make it optional: with no no-arg fallback Spring treats it as required
     * and the context dies with "Parameter 0 of constructor in ApiEmailService required a bean of
     * type ClientCertificateCredential". This is the same shape
     * {@code SharePointCertificateAccess} already runs in production.
     *
     * <p>WARN, not info: on a hub this means inbound email ingestion is off too, which is a real
     * capability loss and should be visible in the log rather than buried.
     */
    public ApiEmailService() {
        this.credential = null;
        this.restTemplate = null;
        log.warn("[Email] No certificate credential - email sending and inbound ingestion are DISABLED.");
    }

    @Autowired(required = false)
    public ApiEmailService(
            ClientCertificateCredential credential,
            @Qualifier("emailRestTemplate") RestTemplate restTemplate) {
        this.credential = credential;
        this.restTemplate = restTemplate;
        log.info("[Email] ApiEmailService created with certificate credential");
    }

    /**
     * Whether this service can actually send.
     *
     * <p>Callers must check rather than relying on the send throwing. {@code EmailFacadeService}
     * catches a send failure and falls through to {@code ManualEmailService}, which calls
     * {@code Desktop.getDesktop().mail(...)} - on a headless hub that throws and is rethrown as a
     * RuntimeException (rolling back the caller's transaction), and on an operator's desktop it
     * pops a real mail-client window from a REST call. Neither is an acceptable consequence of
     * simply having no credential configured.
     */
    public boolean isAvailable() {
        return credential != null && restTemplate != null;
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
     * Send an email whose combined attachment payload exceeds Microsoft Graph's ~4 MB per-request
     * limit for the {@code sendMail} action. Uses the three-step flow: create draft (no
     * attachments) → per-attachment upload session (chunked PUT) → send draft. Individual
     * attachments up to 150 MB and total messages up to your tenant's cap (typically 150 MB) are
     * supported this way — versus ~3 MB per email for the simple {@code sendMail} path.
     * <p>
     * Falls back to the {@code fallbackEmail} sender on a 404 from the primary mailbox, matching
     * the fallback semantics of {@link #sendEmail}.
     */
    public void sendEmailWithLargeAttachments(EmailRequest request) {
        if (credential == null) {
            throw new RuntimeException("ClientCertificateCredential not available for email sending");
        }
        try {
            sendEmailWithLargeAttachmentsAs(request, fromEmail);
        } catch (HttpClientErrorException.NotFound e) {
            if (hasFallback()) {
                log.warn("[Email] Primary mailbox {} failed ({}), trying fallback {}",
                        fromEmail, extractErrorCode(e), fallbackEmail);
                sendEmailWithLargeAttachmentsAs(request, fallbackEmail);
            } else {
                throw e;
            }
        }
    }

    private void sendEmailWithLargeAttachmentsAs(EmailRequest request, String senderEmail) {
        ensureValidToken();

        HttpHeaders jsonHeaders = new HttpHeaders();
        jsonHeaders.setBearerAuth(emailAccessToken);
        jsonHeaders.setContentType(MediaType.APPLICATION_JSON);

        // Step 1: create the draft — WITHOUT attachments. Attachments ride the upload-session
        // flow below; embedding them in the draft creation would hit the same ~4 MB request cap
        // we're trying to escape.
        String draftBody = buildMessageJsonWithoutAttachments(request);
        String createUrl = "https://graph.microsoft.com/v1.0/users/" + senderEmail + "/messages";
        log.debug("[Email] Creating draft (upload-session path) for {} as {}", request.getTo(), senderEmail);
        ResponseEntity<String> draftResp = exchangeWithRetry(
                createUrl, HttpMethod.POST, new HttpEntity<>(draftBody, jsonHeaders), String.class);
        if (!draftResp.getStatusCode().is2xxSuccessful() || draftResp.getBody() == null) {
            throw new RuntimeException("Failed to create draft: " + draftResp.getStatusCode()
                    + " body=" + draftResp.getBody());
        }
        String msgId;
        try {
            msgId = new ObjectMapper().readTree(draftResp.getBody()).path("id").asText(null);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse draft id: " + e.getMessage(), e);
        }
        if (msgId == null || msgId.isEmpty()) {
            throw new RuntimeException("Draft response missing 'id'");
        }

        // Step 2: upload each attachment via createUploadSession + PUT to the pre-signed uploadUrl.
        List<EmailAttachment> attachments = request.getAttachments();
        int uploaded = 0;
        long totalBytes = 0;
        if (attachments != null) {
            for (EmailAttachment att : attachments) {
                long size = uploadAttachmentViaSession(senderEmail, msgId, att);
                uploaded++;
                totalBytes += size;
            }
        }
        log.info("[Email] Uploaded {} attachment(s) totalling {} KB to draft {}",
                uploaded, totalBytes / 1024, msgId);

        // Step 3: send the draft.
        String sendUrl = "https://graph.microsoft.com/v1.0/users/" + senderEmail
                + "/messages/" + msgId + "/send";
        ResponseEntity<String> sendResp = exchangeWithRetry(
                sendUrl, HttpMethod.POST, new HttpEntity<>(jsonHeaders), String.class);
        if (!sendResp.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to send draft: " + sendResp.getStatusCode()
                    + " body=" + sendResp.getBody());
        }
        log.info("[Email] Large-attachment email sent to {} (from {}, {} atts, {} KB)",
                request.getTo(), senderEmail, uploaded, totalBytes / 1024);
    }

    /**
     * Upload one attachment via Microsoft Graph's upload session flow. Returns the decoded size
     * for reporting. Chunk size is 3200 KiB — a valid Graph chunk size (multiple of 320 KiB,
     * under the 4 MB per-chunk limit); the last chunk is whatever's left. Files under 3200 KiB
     * upload in a single PUT.
     */
    private long uploadAttachmentViaSession(String senderEmail, String msgId, EmailAttachment att) {
        String b64 = att.getBase64Content() != null ? att.getBase64Content().replaceAll("\\s+", "") : "";
        if (b64.isEmpty()) {
            log.warn("[Email] Skipping empty attachment: {}", att.getFileName());
            return 0;
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(b64);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Attachment '" + att.getFileName() + "' has invalid base64: " + e.getMessage(), e);
        }
        long totalSize = bytes.length;
        if (totalSize == 0) return 0;

        // Create the upload session. Graph returns a pre-authenticated uploadUrl — subsequent
        // PUTs to that URL must NOT carry the tenant bearer token.
        HttpHeaders sessionHeaders = new HttpHeaders();
        sessionHeaders.setBearerAuth(emailAccessToken);
        sessionHeaders.setContentType(MediaType.APPLICATION_JSON);
        String sessionBody = "{\"AttachmentItem\":{"
                + "\"attachmentType\":\"file\","
                + "\"name\":\"" + escapeJson(att.getFileName()) + "\","
                + "\"size\":" + totalSize
                + "}}";
        String createSessionUrl = "https://graph.microsoft.com/v1.0/users/" + senderEmail
                + "/messages/" + msgId + "/attachments/createUploadSession";
        ResponseEntity<String> sessionResp = exchangeWithRetry(
                createSessionUrl, HttpMethod.POST, new HttpEntity<>(sessionBody, sessionHeaders), String.class);
        if (!sessionResp.getStatusCode().is2xxSuccessful() || sessionResp.getBody() == null) {
            throw new RuntimeException("createUploadSession failed for '" + att.getFileName()
                    + "': " + sessionResp.getStatusCode() + " body=" + sessionResp.getBody());
        }
        String uploadUrl;
        try {
            uploadUrl = new ObjectMapper().readTree(sessionResp.getBody()).path("uploadUrl").asText(null);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse uploadUrl for '" + att.getFileName() + "'", e);
        }
        if (uploadUrl == null || uploadUrl.isEmpty()) {
            throw new RuntimeException("uploadUrl missing for '" + att.getFileName() + "'");
        }

        // Chunk config: multiples of 320 KiB, each chunk < 4 MiB. 3200 KiB = 10 × 320 KiB.
        final int CHUNK_SIZE = 3200 * 1024;
        long offset = 0;
        while (offset < totalSize) {
            int chunkLen = (int) Math.min(CHUNK_SIZE, totalSize - offset);
            byte[] chunk = new byte[chunkLen];
            System.arraycopy(bytes, (int) offset, chunk, 0, chunkLen);

            HttpHeaders chunkHeaders = new HttpHeaders();
            chunkHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            chunkHeaders.setContentLength(chunkLen);
            chunkHeaders.set("Content-Range",
                    "bytes " + offset + "-" + (offset + chunkLen - 1) + "/" + totalSize);
            // NOTE: uploadUrl is pre-signed by Graph — do NOT include Authorization.

            ResponseEntity<String> putResp = putChunkWithThrottleRetry(
                    uploadUrl, chunk, chunkHeaders, att.getFileName(), offset);
            if (!putResp.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Chunk PUT failed for '" + att.getFileName()
                        + "' at offset " + offset + ": " + putResp.getStatusCode()
                        + " body=" + putResp.getBody());
            }
            offset += chunkLen;
        }
        return totalSize;
    }

    /**
     * PUTs a chunk to a pre-signed upload URL with 429/Retry-After handling. Graph's
     * IncomingBytes throttle can trip mid-upload after a burst — reuse the same backoff
     * schedule as {@link #exchangeWithRetry} instead of failing the whole email.
     */
    private ResponseEntity<String> putChunkWithThrottleRetry(String uploadUrl, byte[] chunk,
                                                             HttpHeaders chunkHeaders,
                                                             String fileName, long offset) {
        for (int attempt = 0; ; attempt++) {
            try {
                return restTemplate.exchange(
                        uploadUrl, HttpMethod.PUT, new HttpEntity<>(chunk, chunkHeaders), String.class);
            } catch (HttpClientErrorException.TooManyRequests e) {
                if (attempt >= MAX_THROTTLE_RETRIES) {
                    log.error("[Email] 429 throttled on chunk PUT for '{}' at offset {} after {} retries",
                            fileName, offset, MAX_THROTTLE_RETRIES);
                    throw e;
                }
                final int a = attempt;
                long waitSec = parseRetryAfterSeconds(e.getResponseHeaders())
                        .orElseGet(() -> (long) THROTTLE_BACKOFF_SEC[Math.min(a, THROTTLE_BACKOFF_SEC.length - 1)]);
                log.warn("[Email] 429 throttled on chunk PUT for '{}' (attempt {}/{}), sleeping {}s",
                        fileName, attempt + 1, MAX_THROTTLE_RETRIES, waitSec);
                try {
                    Thread.sleep(waitSec * 1000L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted while waiting for throttle backoff", ie);
                }
            }
        }
    }

    /** Draft-safe variant of the message JSON — everything except the attachments array. */
    private String buildMessageJsonWithoutAttachments(EmailRequest request) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"subject\": \"").append(escapeJson(request.getSubject())).append("\",");
        json.append("\"body\": {");
        json.append("\"contentType\": \"").append(request.isHtml() ? "HTML" : "Text").append("\",");
        json.append("\"content\": \"").append(escapeJson(request.getBody())).append("\"");
        json.append("},");
        json.append("\"toRecipients\": [{");
        json.append("\"emailAddress\": {\"address\": \"").append(escapeJson(request.getTo())).append("\"}");
        json.append("}]");
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
        json.append("}");
        return json.toString();
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
     * Executes a REST exchange with automatic 401 retry and 429 throttle handling.
     * On Unauthorized, invalidates cached token, re-authenticates, and retries once.
     * On TooManyRequests, honors the Retry-After header (or falls back to exponential
     * backoff 30s → 60s → 120s) and retries up to {@link #MAX_THROTTLE_RETRIES} times.
     * Graph's tenant-wide IncomingBytes limit can trip after a burst of upload-session
     * traffic (~150 MB / 5 min) — see the SDS gap-report email flow.
     */
    private <T> ResponseEntity<T> exchangeWithRetry(String url, HttpMethod method,
                                                      HttpEntity<?> entity, Class<T> responseType) {
        for (int attempt = 0; ; attempt++) {
            try {
                return restTemplate.exchange(url, method, entity, responseType);
            } catch (HttpClientErrorException.Unauthorized e) {
                log.warn("[Email] 401 received, refreshing token and retrying: {} {}", method, url);
                emailTokenExpirationTime = null;
                ensureValidToken();
                HttpHeaders newHeaders = new HttpHeaders();
                newHeaders.putAll(entity.getHeaders());
                newHeaders.setBearerAuth(emailAccessToken);
                entity = new HttpEntity<>(entity.getBody(), newHeaders);
            } catch (HttpClientErrorException.TooManyRequests e) {
                if (attempt >= MAX_THROTTLE_RETRIES) {
                    log.error("[Email] 429 throttled after {} retries, giving up: {} {}",
                            MAX_THROTTLE_RETRIES, method, url);
                    throw e;
                }
                final int a = attempt;
                long waitSec = parseRetryAfterSeconds(e.getResponseHeaders())
                        .orElseGet(() -> (long) THROTTLE_BACKOFF_SEC[Math.min(a, THROTTLE_BACKOFF_SEC.length - 1)]);
                log.warn("[Email] 429 throttled ({} attempt {}/{}), sleeping {}s before retry",
                        extractErrorCode(e), attempt + 1, MAX_THROTTLE_RETRIES, waitSec);
                try {
                    Thread.sleep(waitSec * 1000L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted while waiting for throttle backoff", ie);
                }
            }
        }
    }

    private static final int MAX_THROTTLE_RETRIES = 4;
    private static final int[] THROTTLE_BACKOFF_SEC = {30, 60, 120, 240};

    private java.util.Optional<Long> parseRetryAfterSeconds(HttpHeaders headers) {
        if (headers == null) return java.util.Optional.empty();
        String ra = headers.getFirst(HttpHeaders.RETRY_AFTER);
        if (ra == null || ra.isBlank()) return java.util.Optional.empty();
        try {
            long sec = Long.parseLong(ra.trim());
            return java.util.Optional.of(Math.max(1L, Math.min(sec, 600L)));
        } catch (NumberFormatException ignored) {
            return java.util.Optional.empty();
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
                        .bodyPreview(getTextValue(messageNode, "bodyPreview"))
                        .senderEmail(extractSenderEmail(messageNode))
                        .toRecipients(extractToRecipients(messageNode))
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

    /** Extracts the "to" recipient email addresses from a Graph message node. */
    private List<String> extractToRecipients(JsonNode messageNode) {
        List<String> tos = new ArrayList<>();
        JsonNode arr = messageNode.get("toRecipients");
        if (arr != null && arr.isArray()) {
            for (JsonNode r : arr) {
                JsonNode addr = r.path("emailAddress").path("address");
                if (!addr.isMissingNode() && !addr.asText("").isBlank()) tos.add(addr.asText());
            }
        }
        return tos;
    }

    /**
     * List recent messages from a well-known folder ("inbox" or "sentitems") of the monitored mailbox
     * ({@code email.graph.from}). Read-only; used by the Correspondence Inbox/Outbox tabs. Returns empty when the
     * certificate credential is unavailable.
     */
    public List<GraphEmailMessage> listFolderMessages(String folder, int top) {
        if (credential == null) {
            log.warn("[Email] Cannot read mailbox - certificate credential not available");
            return Collections.emptyList();
        }
        String safeFolder = "sentitems".equalsIgnoreCase(folder) ? "sentitems" : "inbox";
        String orderBy = "sentitems".equals(safeFolder) ? "sentDateTime desc" : "receivedDateTime desc";
        // bodyPreview (light) instead of full body keeps larger fetches cheap
        int pageSize = Math.min(Math.max(top, 1), 500);
        try {
            ensureValidToken();
            String url = String.format(
                "https://graph.microsoft.com/v1.0/users/%s/mailFolders/%s/messages?" +
                "$top=%d&" +
                "$select=id,subject,bodyPreview,sender,toRecipients,sentDateTime,receivedDateTime," +
                "internetMessageId,conversationId,isRead&" +
                "$orderby=%s",
                fromEmail, safeFolder, pageSize, orderBy);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(emailAccessToken);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            ResponseEntity<String> response = exchangeWithRetry(
                    url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGraphMessages(response.getBody());
            }
            log.error("[Email] Failed to list {} messages. Status: {}", safeFolder, response.getStatusCode());
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("[Email] Error listing {} messages: {}", safeFolder, e.getMessage());
            return Collections.emptyList();
        }
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
