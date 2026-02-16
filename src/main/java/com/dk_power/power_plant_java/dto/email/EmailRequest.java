package com.dk_power.power_plant_java.dto.email;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * DTO for email requests.
 * Used by EmailFacadeService to send emails via API or manual fallback.
 */
@Data
@Builder
public class EmailRequest {
    private String to;
    private String from;
    private String cc;
    private String subject;
    private String body;
    private List<EmailAttachment> attachments;
}
