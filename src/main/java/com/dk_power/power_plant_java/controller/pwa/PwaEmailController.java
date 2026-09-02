package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.email.EmailAttachment;
import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.dto.pwa.PwaEmailRequest;
import com.dk_power.power_plant_java.sevice.email.EmailFacadeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pwa/email")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaEmailController {

    private final EmailFacadeService emailFacadeService;

    @Value("${email.graph.from:}")
    private String operationsEmail;

    @Value("${email.fallback.cc:}")
    private String fallbackCc;

    @PostMapping("/send-fallback")
    public ResponseEntity<NgApiResponse<String>> sendFallback(@RequestBody PwaEmailRequest dto) {
        try {
            List<EmailAttachment> attachments = null;
            if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
                attachments = dto.getAttachments().stream()
                        .map(a -> EmailAttachment.builder()
                                .fileName(a.getFileName())
                                .contentType(a.getContentType())
                                .base64Content(a.getBase64Content())
                                .build())
                        .collect(Collectors.toList());
            }

            EmailRequest emailRequest = EmailRequest.builder()
                    .to(operationsEmail)
                    .cc(fallbackCc)
                    .subject(dto.getSubject())
                    .body(dto.getBody())
                    .attachments(attachments)
                    .build();

            emailFacadeService.sendEmail(emailRequest);
            log.info("[PWA Email] Fallback email sent: subject={}", dto.getSubject());
            return ResponseEntity.ok(new NgApiResponse<>("sent", "Email sent successfully"));
        } catch (Exception e) {
            log.error("[PWA Email] Fallback email failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Failed to send email: " + e.getMessage()));
        }
    }
}
