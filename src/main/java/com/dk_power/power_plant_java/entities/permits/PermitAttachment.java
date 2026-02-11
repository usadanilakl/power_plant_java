package com.dk_power.power_plant_java.entities.permits;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "permit_attachment")
@Getter
@Setter
public class PermitAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String entityType;      // "WorkRequest", "Jha"
    private Long entityId;

    private String fileName;
    private String contentType;
    private String attachmentType;  // "photo", "signature", "document"

    @Column(columnDefinition = "TEXT")
    private String base64Content;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
