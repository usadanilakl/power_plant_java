package com.dk_power.power_plant_java.entities.messaging;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversation")
@NoArgsConstructor
@Getter
@Setter
public class Conversation extends BaseAuditEntity {

    public enum Status {
        OPEN,
        CLOSED
    }

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "initiator_id", nullable = false)
    private Long initiatorId;

    @Column(name = "responder_id", nullable = false)
    private Long responderId;

    @Column(length = 500, nullable = false)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "initiator_unread_count", nullable = false)
    private Integer initiatorUnreadCount = 0;

    @Column(name = "responder_unread_count", nullable = false)
    private Integer responderUnreadCount = 0;
}
