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
}
