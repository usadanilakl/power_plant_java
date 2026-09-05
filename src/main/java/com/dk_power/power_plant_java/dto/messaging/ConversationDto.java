package com.dk_power.power_plant_java.dto.messaging;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ConversationDto extends BaseDto {
    private String entityType;
    private Long entityId;
    private Long initiatorId;
    private Long responderId;
    private String initiatorName;
    private String responderName;
    private String subject;
    private String status;
    private LocalDateTime lastMessageAt;
    private Integer initiatorUnreadCount = 0;
    private Integer responderUnreadCount = 0;
    private Integer currentUserUnreadCount = 0;
    private String initialMessageContent;
    // ── WO Q&A extension ──
    private String maximoWonum;
    private String maximoHref;
    /** Comma-joined User.id list directed at (routing hint only). */
    private String directedUserIds;
    /** Transient (not persisted): true when the current user's id is in directedUserIds — set server-side for the inbox. */
    private Boolean directedToMe;
}
