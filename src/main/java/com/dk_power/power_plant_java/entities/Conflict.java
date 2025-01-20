package com.dk_power.power_plant_java.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conflict {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String entityType; // "Equipment" or "LotoPoint"
    @Column(columnDefinition = "TEXT")
    private String entityId;
    @Enumerated(EnumType.STRING)
    private ConflictType conflictType;
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    private ConflictStatus status;
    
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public enum ConflictStatus {
        OPEN, RESOLVED, IGNORED
    }

    public enum ConflictType {
        equipment_duplicates,equipment_coordinates,equipment_lp_tag_mismatch,loto_point_noEq,loto_point_duplicates,loto_point_unprocessed
    }
}