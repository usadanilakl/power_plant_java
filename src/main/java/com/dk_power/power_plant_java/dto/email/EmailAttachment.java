package com.dk_power.power_plant_java.dto.email;

import lombok.Builder;
import lombok.Data;

/**
 * DTO for email attachments.
 * Attachments are base64-encoded for transmission.
 */
@Data
@Builder
public class EmailAttachment {
    private String fileName;
    private String contentType;
    private String base64Content;
}
