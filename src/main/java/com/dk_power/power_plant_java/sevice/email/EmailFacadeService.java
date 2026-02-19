package com.dk_power.power_plant_java.sevice.email;

import com.dk_power.power_plant_java.dto.email.EmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Facade service for sending emails.
 * Attempts API-based sending first, falls back to manual email client on failure.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailFacadeService {

    private final ApiEmailService apiEmailService;
    private final ManualEmailService manualEmailService;

    /**
     * Sends email via API (primary) or manual email client (fallback).
     * @param request Email request with to/from/cc/subject/body/attachments
     */
    public void sendEmail(EmailRequest request) {
        try {
            apiEmailService.sendEmail(request);
            log.info("[Email] Email sent via API to {}", request.getTo());
        } catch (Exception e) {
            log.warn("[Email] API sending failed, falling back to manual email client: {}", e.getMessage());
            try {
                manualEmailService.openEmailClient(request);
            } catch (Exception fallbackException) {
                log.error("[Email] Both API and manual fallback failed", fallbackException);
                throw new RuntimeException("Failed to send email via both API and manual fallback", fallbackException);
            }
        }
    }

    /**
     * Sends email via API using draft-then-send approach to capture metadata.
     * Returns metadata (graphMessageId, internetMessageId, conversationId) for correspondence tracking.
     * Falls back to manual email client if API fails, returning null metadata.
     */
    public ApiEmailService.SentEmailMetadata sendEmailWithMetadata(EmailRequest request) {
        try {
            ApiEmailService.SentEmailMetadata metadata = apiEmailService.sendEmailAndGetMetadata(request);
            log.info("[Email] Email sent via API (with metadata) to {}", request.getTo());
            return metadata;
        } catch (Exception e) {
            log.warn("[Email] API sending with metadata failed, falling back to manual: {}", e.getMessage());
            try {
                manualEmailService.openEmailClient(request);
            } catch (Exception fallbackException) {
                log.error("[Email] Both API and manual fallback failed", fallbackException);
                throw new RuntimeException("Failed to send email via both API and manual fallback", fallbackException);
            }
            return null;
        }
    }
}
