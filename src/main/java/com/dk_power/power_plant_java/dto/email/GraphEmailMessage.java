package com.dk_power.power_plant_java.dto.email;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for representing email messages from Microsoft Graph API.
 * Used when reading emails from the inbox for correspondence tracking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphEmailMessage {

    private String id;  // Graph message ID
    private String subject;
    private String bodyContent;
    private String bodyContentType;
    private String senderEmail;
    private String senderName;
    private List<String> toRecipients;
    private LocalDateTime sentDateTime;
    private LocalDateTime receivedDateTime;
    private String internetMessageId;
    private String conversationId;
    private Boolean isRead;
    private List<InternetMessageHeader> headers;

    /**
     * Represents an email header (for In-Reply-To matching)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InternetMessageHeader {
        private String name;
        private String value;
    }
}
