package com.dk_power.power_plant_java.sevice.email;

import com.dk_power.power_plant_java.dto.email.EmailRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Desktop;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Manual email service that opens the user's default email client.
 * Used as fallback when API-based email sending is unavailable.
 */
@Service
@Slf4j
public class ManualEmailService {

    /**
     * Opens the default email client with pre-filled email data.
     * @param request Email request with to/subject/body/cc
     */
    public void openEmailClient(EmailRequest request) {
        try {
            if (!Desktop.isDesktopSupported()) {
                throw new RuntimeException("Desktop is not supported on this system");
            }

            String mailto = buildMailtoUrl(request);
            Desktop desktop = Desktop.getDesktop();
            desktop.mail(new URI(mailto));

            log.info("[Email] Opened default email client for manual send to {}", request.getTo());
        } catch (Exception e) {
            log.error("[Email] Failed to open email client: {}", e.getMessage(), e);
            throw new RuntimeException("Manual email fallback failed: " + e.getMessage(), e);
        }
    }

    /**
     * Builds a mailto: URL with encoded parameters.
     * Note: Attachments are not supported in mailto URLs.
     */
    private String buildMailtoUrl(EmailRequest request) {
        StringBuilder mailto = new StringBuilder("mailto:");
        mailto.append(URLEncoder.encode(request.getTo(), StandardCharsets.UTF_8));

        mailto.append("?subject=").append(URLEncoder.encode(request.getSubject(), StandardCharsets.UTF_8));
        mailto.append("&body=").append(URLEncoder.encode(request.getBody(), StandardCharsets.UTF_8));

        if (request.getCc() != null && !request.getCc().isEmpty()) {
            mailto.append("&cc=").append(URLEncoder.encode(request.getCc(), StandardCharsets.UTF_8));
        }

        return mailto.toString();
    }
}
