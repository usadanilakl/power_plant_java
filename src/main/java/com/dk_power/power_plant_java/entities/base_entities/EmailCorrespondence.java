package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.Referenceable;
import com.dk_power.power_plant_java.sevice.sync.FieldChangeEntityListener;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;

/**
 * Generic email correspondence tracking entity.
 * Uses polymorphic association (entityType + entityId) to link to any entity.
 * Follows the Comment entity pattern for maximum flexibility and reusability.
 */
@Entity
@Audited
@NoArgsConstructor
@Getter
@Setter
@Where(clause = "deleted IS NOT TRUE")
@EntityListeners(FieldChangeEntityListener.class)
public class EmailCorrespondence extends BaseAuditEntity implements Referenceable {

    public enum Direction {
        OUTBOUND,  // Sent from system to user
        INBOUND    // Reply from user to system
    }

    // ========== Polymorphic Association (like Comment) ==========
    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_type")
    private String entityType;

    // ========== Categorization (like Comment) ==========
    @ManyToOne
    @JoinColumn(name = "correspondence_type_id")
    private Value correspondenceType;  // "Request Details", "Notification", "General", etc.

    // ========== Email-Specific Fields ==========
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Direction direction;

    @Column(length = 500)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String bodyContent;

    @Column(length = 255)
    private String sender;

    @Column(length = 255)
    private String recipient;

    private LocalDateTime sentDateTime;

    // ========== Graph API Tracking Fields ==========
    @Column(length = 500)
    @org.hibernate.annotations.Index(name = "idx_internet_message_id")
    private String internetMessageId;

    @Column(length = 500)
    @org.hibernate.annotations.Index(name = "idx_conversation_id")
    private String conversationId;

    @Column(length = 500)
    private String graphMessageId;

    // ========== Status Fields ==========
    @Column(nullable = false)
    private Boolean isRead = false;

    @Column(nullable = false)
    private Boolean needsAttention = false;

    @Override
    public String getObjectType() {
        return "EmailCorrespondence";
    }
}
