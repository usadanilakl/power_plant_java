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
    /** When true, the body is rendered as HTML by the receiving mail client.
     *  Defaults to false so existing plain-text callers keep their current behavior. */
    private boolean html;
}
